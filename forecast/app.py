import json
import base64
import io
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use("Agg")  # ✅ Backend sin GUI
import matplotlib.pyplot as plt
from prophet import Prophet
from statsmodels.tsa.stattools import acf
from sklearn.linear_model import LinearRegression
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
from joblib import Parallel, delayed

# ==============================================================
# 🔧 CONFIGURACIÓN
# ==============================================================
logging.getLogger("cmdstanpy").disabled = True
logging.getLogger("prophet").disabled = True


# ==============================================================
# 🔧 PARÁMETROS GLOBALES CONFIGURABLES
# ==============================================================
INTERVAL_WIDTH = 0.95
PERIODS_ADELANTE = 12          # meses a proyectar (por defecto)
FREQ = "MS"                    # frecuencia mensual
SMOOTH_WINDOW = 3               # ventana para suavizado (mediana movil)
WINSOR_PCT = 0.05               # porcentaje para winsorizar picos
DEFAULT_INCLUIR_GRAFICO = False  # 🔧 controlar si se devuelve el gráfico


# ==============================================================
# 🔩 FUNCIONES AUXILIARES
# ==============================================================

def limpiar_y_preparar_datos(data):
    """Recibe lista de dicts con año, mes, ingresos, egresos.
       Crea columna de fecha y prepara datasets para Prophet."""
    df = pd.DataFrame(data)

    # Validación de columnas
    if not {"año", "mes", "ingresos", "egresos"}.issubset(df.columns):
        raise ValueError("Las columnas requeridas son: año, mes, ingresos, egresos")

    # Crear columna de fecha (primer día de cada mes)
    df["fecha"] = pd.to_datetime(dict(year=df["año"], month=df["mes"], day=1))
    df = df.sort_values("fecha").reset_index(drop=True)

    # Normalizar signos: ingresos >= 0, egresos <= 0
    df["ingresos"] = df["ingresos"].clip(lower=0)
    df["egresos"] = df["egresos"].clip(upper=0)

    # Suavizar series para reducir picos bruscos (enfatiza tendencia)
    df["ingresos"] = suavizar_serie(df["ingresos"])
    df["egresos"] = suavizar_serie(df["egresos"])

    # Calcular balance mensual
    df["balance"] = df["ingresos"] + df["egresos"]

    # Preparar datasets separados para Prophet
    df_ing = df.rename(columns={"fecha": "ds", "ingresos": "y"})[["ds", "y"]]
    df_egr = df.rename(columns={"fecha": "ds", "egresos": "y"})[["ds", "y"]]

    return df, df_ing, df_egr


def suavizar_serie(serie):
    """Suaviza una serie con mediana movil y winsorizacion para evitar picos."""
    s = pd.Series(serie).astype(float)

    # Mediana movil para reducir outliers puntuales
    if SMOOTH_WINDOW and SMOOTH_WINDOW > 1:
        s = s.rolling(window=SMOOTH_WINDOW, center=True, min_periods=1).median()

    # Winsorizar extremos para evitar picos bruscos
    if WINSOR_PCT and 0 < WINSOR_PCT < 0.5:
        low = s.quantile(WINSOR_PCT)
        high = s.quantile(1 - WINSOR_PCT)
        s = s.clip(lower=low, upper=high)

    return s


def convertir_tipos(obj):
    """Convierte objetos numpy a tipos nativos para serialización JSON."""
    if isinstance(obj, (np.bool_, bool)):
        return bool(obj)
    elif isinstance(obj, (np.integer, int)):
        return int(obj)
    elif isinstance(obj, (np.floating, float)):
        return float(obj)
    elif isinstance(obj, (np.ndarray, list, tuple)):
        return [convertir_tipos(x) for x in obj]
    elif isinstance(obj, dict):
        return {k: convertir_tipos(v) for k, v in obj.items()}
    else:
        return obj


# ==============================================================
# 🧮 ENTRENAMIENTO Y PREDICCIÓN
# ==============================================================

def entrenar_modelo(df_prophet, tipo="balance"):
    """
    Entrena un Prophet optimizado para series MENSUALES.
    Detecta mejor estacionalidad anual, evita rectas y mejora sensibilidad.
    """

    y = df_prophet["y"].values
    n = len(y)

    if n < 6:
        raise ValueError(f"No hay suficientes datos para predecir {tipo}.")

    # ================================================
    # 🔹 1. Detección de tendencia — pero menos estricta
    # ================================================
    X = np.arange(n).reshape(-1, 1)
    reg = LinearRegression().fit(X, y)
    pendiente = reg.coef_[0]
    media = np.mean(np.abs(y))

    tendencia_estable = abs(pendiente) < 0.001 * media

    # ================================================
    # 🔹 2. Detección de estacionalidad anual
    # ================================================
    acf_vals = acf(y, nlags=min(18, n - 1), fft=False)
    autocorr_anual = acf_vals[12] if len(acf_vals) > 12 else 0
    hay_estacionalidad = abs(autocorr_anual) > 0.15

    # ================================================
    # 🔹 3. Parámetros Prophet (VERSIÓN OPTIMIZADA)
    # ================================================
    # Mayor sensibilidad para evitar rectas
    changepoint_scale = 0.05 if tendencia_estable else 0.10

    # Estacionalidad reforzada
    seasonality_scale = 5.0 if hay_estacionalidad else 10.0

    # Fourier según años de datos
    years = max(1, n // 12)
    fourier = min(10, 4 + years * 2)

    m = Prophet(
        growth="linear",
        interval_width=INTERVAL_WIDTH,
        changepoint_prior_scale=changepoint_scale,
        seasonality_prior_scale=seasonality_scale,
        yearly_seasonality=False,  # lo activamos manualmente
        weekly_seasonality=False,
        daily_seasonality=False,
        seasonality_mode="additive"  # mensual funciona mejor aditivo
    )

    # Forzar estacionalidad anual SIEMPRE para datos mensuales
    m.add_seasonality(
        name="anual",
        period=365.25,
        fourier_order=fourier
    )

    m.fit(df_prophet)

    return m, {
        "tipo": tipo,
        "pendiente": float(pendiente),
        "tendencia_estable": tendencia_estable,
        "media_abs": float(media),
        "autocorr_anual": float(autocorr_anual),
        "hay_estacionalidad": hay_estacionalidad,
        "changepoint_prior_scale": changepoint_scale,
        "seasonality_prior_scale": seasonality_scale,
        "fourier": fourier
    }



def entrenar_y_predecir(df, df_ing, df_egr, periodos_adelante):
    """Predice ingresos y egresos por separado, calcula balance y devuelve todo."""

    # Entrenamiento paralelo de ingresos y egresos
    res = Parallel(n_jobs=2)(
        delayed(entrenar_modelo)(df, tipo)
        for df, tipo in [(df_ing, "ingresos"), (df_egr, "egresos")]
    )
    m_ing, p_ing = res[0]
    m_egr, p_egr = res[1]

    # Fechas futuras
    last_date = df["fecha"].max()

    # Predicciones extendidas (para mantener continuidad)
    forecast_ing = m_ing.predict(m_ing.make_future_dataframe(periods=periodos_adelante, freq="MS"))
    forecast_egr = m_egr.predict(m_egr.make_future_dataframe(periods=periodos_adelante, freq="MS"))

    # Tomar solo el tramo futuro
    forecast_ing_future = forecast_ing[forecast_ing["ds"] > last_date].copy()
    forecast_egr_future = forecast_egr[forecast_egr["ds"] > last_date].copy()

    # Enforzar signos en predicciones
    forecast_ing_future["yhat"] = forecast_ing_future["yhat"].clip(lower=0)
    forecast_egr_future["yhat"] = forecast_egr_future["yhat"].clip(upper=0)

    # Calcular balance estimado (suma directa)
    forecast_balance = forecast_ing_future[["ds", "yhat"]].copy()
    forecast_balance["yhat"] += forecast_egr_future["yhat"].values

    # Resumen
    resumen = pd.DataFrame({
        "Año": forecast_balance["ds"].dt.year,
        "Mes": forecast_balance["ds"].dt.month,
        "Ingresos_Esperados": forecast_ing_future["yhat"].round(2),
        "Egresos_Esperados": forecast_egr_future["yhat"].round(2),
        "Balance_Neto_Esperado": forecast_balance["yhat"].round(2),
    })

    parametros = {"ingresos": p_ing, "egresos": p_egr}

    return resumen, parametros, forecast_ing_future, forecast_egr_future, forecast_balance


# ==============================================================
# 🎨 GRÁFICO
# ==============================================================

def generar_grafico(df, f_ing, f_egr, f_bal):
    """Genera gráfico y devuelve imagen en Base64."""
    fig, ax = plt.subplots(figsize=(10, 5))

    # Parte real
    ax.plot(df["fecha"], df["ingresos"], label="Ingresos Reales", color="green", marker="o")
    ax.plot(df["fecha"], df["egresos"], label="Egresos Reales", color="red", marker="o")
    ax.plot(df["fecha"], df["balance"], label="Balance Real", color="blue", marker="o")

    # Forecasts
    ax.plot(f_ing["ds"], f_ing["yhat"], "--", color="limegreen", label="Ingresos Estimados", marker="o")
    ax.plot(f_egr["ds"], f_egr["yhat"], "--", color="salmon", label="Egresos Estimados", marker="o")
    ax.plot(f_bal["ds"], f_bal["yhat"], "--", color="orange", label="Balance Estimado", marker="o")

    # Línea de separación
    ax.axvline(x=df["fecha"].max(), color="gray", linestyle=":")
    # Etiquetas para diferenciar datos reales vs pronosticados
    y_max = max(
        df["ingresos"].max(),
        df["egresos"].max(),
        df["balance"].max(),
        f_ing["yhat"].max(),
        f_egr["yhat"].max(),
        f_bal["yhat"].max()
    )
    ax.text(df["fecha"].min(), y_max, "Datos reales", color="black",
            verticalalignment="bottom", fontsize=9)
    ax.text(f_ing["ds"].max(), y_max, "Datos pronosticados", color="black",
            verticalalignment="bottom", fontsize=9, horizontalalignment="right")
    ax.set_title("Forecast de Ingresos, Egresos y Balance (Mensual)")
    ax.set_xlabel("Fecha")
    ax.set_ylabel("Monto ($)")
    ax.legend()
    ax.grid(True)

    buf = io.BytesIO()
    plt.tight_layout()
    plt.savefig(buf, format="png")
    plt.close(fig)
    buf.seek(0)
    return base64.b64encode(buf.getvalue()).decode("utf-8")


# ==============================================================
# 🌐 API FLASK / AWS LAMBDA
# ==============================================================

app = Flask(__name__)
CORS(app)  # Permitir CORS desde cualquier origen

@app.route("/forecast", methods=["POST"])
def forecast_endpoint():
    try:
        body = request.get_json()
        data = body.get("data", [])
        periodos_adelante = body.get("periodos_adelante", PERIODS_ADELANTE)

        df, df_ing, df_egr = limpiar_y_preparar_datos(data)
        resumen, parametros, f_ing, f_egr, f_bal = entrenar_y_predecir(df, df_ing, df_egr, periodos_adelante)

        response = {
            "status": "ok",
            "parametros_usados": parametros,
            "forecast_mensual": resumen.to_dict(orient="records")
        }

        if DEFAULT_INCLUIR_GRAFICO:
            response["grafico_base64"] = generar_grafico(df, f_ing, f_egr, f_bal)

        response = convertir_tipos(response)
        return jsonify(response)

    except Exception as e:
        return jsonify({"status": "error", "detalle": str(e)}), 400


# ==============================================================
# 🧩 HANDLER PARA AWS LAMBDA
# ==============================================================

def lambda_handler(event, context):
    try:
        # Body puede venir como string, dict o None
        raw_body = event.get("body")

        if raw_body is None:
            raise Exception("No body received")

        if isinstance(raw_body, str):
            body = json.loads(raw_body)
        else:
            body = raw_body  # ya viene como dict

        data = body.get("data", [])
        periodos_adelante = body.get("periodos_adelante", PERIODS_ADELANTE)

        df, df_ing, df_egr = limpiar_y_preparar_datos(data)
        resumen, parametros, f_ing, f_egr, f_bal = entrenar_y_predecir(
            df, df_ing, df_egr, periodos_adelante
        )

        response = {
            "status": "ok",
            "parametros_usados": parametros,
            "forecast_mensual": resumen.to_dict(orient="records")
        }

        if DEFAULT_INCLUIR_GRAFICO:
            response["grafico_base64"] = generar_grafico(df, f_ing, f_egr, f_bal)

        return {
            "statusCode": 200,
            "headers": { "Content-Type": "application/json" },
            "body": json.dumps(convertir_tipos(response))
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "headers": { "Content-Type": "application/json" },
            "body": json.dumps({ "error": str(e) })
        }



# ==============================================================
# 🧪 MODO LOCAL
# ==============================================================

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8088, debug=False, use_reloader=False)
