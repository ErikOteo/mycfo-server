import pytesseract
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
import re
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import io
import logging
from joblib import Parallel, delayed
import cv2
import numpy as np

# ------------------------------------------
# CONFIG FLASK
# ------------------------------------------

app = Flask(__name__)
CORS(app)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

# ------------------------------------------
# SINÓNIMOS EDITABLES
# ------------------------------------------

SYNONYMS = {
    "ingreso": {
        "monto_total": ["monto", "total", "importe", "valor", "precio"],
        "fecha_emision": ["fecha", "emision", "emitido"],
        "nombre_cliente": ["cliente", "comprador", "nombre"],
        "cuit_cliente": ["cuit", "identificacion", "dni", "tax id"],
        "descripcion": ["detalle", "concepto", "descripcion"],
        "medio_pago": ["medio de pago", "forma de pago", "pago"]
    },
    "egreso": {
        "monto_total": ["monto", "total", "importe", "valor", "precio"],
        "fecha_emision": ["fecha", "emision", "emitido"],
        "nombre_proveedor": ["proveedor", "vendedor", "razon social"],
        "cuit_proveedor": ["cuit", "identificacion", "dni", "tax id"],
        "descripcion": ["detalle", "concepto", "descripcion"],
        "medio_pago": ["medio de pago", "forma de pago", "pago"]
    },
    "factura": {
        "numero_documento": ["número de factura", "numero", "documento", "factura"],
        "version": ["version", "versión"],
        "tipo_factura": ["factura a", "FACTURA A", "factura b", "factura c"],
        "fecha_emision": ["fecha", "emision"],
        "monto_total": ["monto total", "monto total :", "total :", "monto:", "total "]
    }
}

# ------------------------------------------
# HELPERS DE EXTRACCIÓN
# ------------------------------------------

def extract_number(text):
    match = re.search(r"\b\d[\d\.,]*\b", text.replace(".", "").replace(",", "."))
    return match.group(0) if match else ""

def extract_date(text):
    match = re.search(r"\b(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4})\b", text)
    return match.group(0) if match else ""

def extract_field(raw_text, keywords):
    raw_text_lower = raw_text.lower()
    lines = raw_text_lower.split("\n")

    for kw in keywords:
        for line in lines:
            if kw in line:
                return line
    return ""

def extract_after_keyword(line):
    if ":" in line:
        return line.split(":", 1)[1].strip()
    if "-" in line:
        return line.split("-", 1)[1].strip()
    return line.strip()

def extract_last_number(text):
    numbers = re.findall(r"\b\d[\d\.,]*\b", text.replace(".", "").replace(",", "."))
    return numbers[-1] if numbers else ""


# ------------------------------------------
# PROCESAR SEGÚN TIPO
# ------------------------------------------

def process_text(text, doc_type):

    synonyms = SYNONYMS.get(doc_type, {})
    extracted = {field: "" for field in synonyms.keys()}

    for field, words in synonyms.items():

        line = extract_field(text, words)
        if not line:
            continue

        content = extract_after_keyword(line)

        if "monto" in field:
            extracted[field] = extract_number(content) or extract_number(line)

        elif "fecha" in field:
            extracted[field] = extract_date(content) or extract_date(line)

        elif "cuit" in field:
            match = re.search(r"\b\d{2}-\d{8}-\d\b", line)
            extracted[field] = match.group(0) if match else ""

        elif field == "tipo_factura":
            line_l = line.lower()
            if " a" in line_l: extracted[field] = "A"
            elif " b" in line_l: extracted[field] = "B"
            elif " c" in line_l: extracted[field] = "C"

        else:
            extracted[field] = content.strip()

    return extracted

# ------------------------------------------
# OCR FUNCIONALIDAD
# ------------------------------------------

def ocr_image(file_bytes):
    """Realiza OCR de una imagen con preprocesamiento avanzado."""


    # convertir a arreglo
    file_arr = np.frombuffer(file_bytes, np.uint8)
    img = cv2.imdecode(file_arr, cv2.IMREAD_COLOR)

    # 1) pasar a escala de grises
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # 2) aumentar contraste
    gray = cv2.convertScaleAbs(gray, alpha=1.5, beta=0)

    # 3) eliminar ruido
    gray = cv2.GaussianBlur(gray, (3, 3), 0)

    # 4) binarización adaptativa (clave para facturas)
    thresh = cv2.adaptiveThreshold(
        gray, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        31,
        10
    )

    # 5) aumentar tamaño ×1.5
    thresh = cv2.resize(thresh, None, fx=1.5, fy=1.5, interpolation=cv2.INTER_LINEAR)

    # 6) convertir a PIL
    pil_img = Image.fromarray(thresh)

    # 7) parámetros avanzados para facturas
    custom_config = r"--oem 3 --psm 6"

    text = pytesseract.image_to_string(pil_img, lang="spa", config=custom_config)

    return text


# ------------------------------------------
# ENDPOINT OCR
# ------------------------------------------

@app.post("/scan")
def scan_document():
    try:
        tipo = request.form.get("tipo")
        file = request.files.get("file")

        if not tipo or tipo not in SYNONYMS:
            return jsonify({"error": "tipo inválido"}), 400

        if not file:
            return jsonify({"error": "No se envió una imagen"}), 400

        file_bytes = file.read()

        # OCR
        text = ocr_image(file_bytes)

        # Procesar
        extracted = process_text(text, tipo)

        return jsonify({
            "tipo_documento": tipo,
            "ocr_raw": text,
            "datos": extracted
        })

    except Exception as e:
        logging.error(f"Error procesando la imagen: {e}")
        return jsonify({"error": "Error procesando la imagen", "detail": str(e)}), 500

# ------------------------------------------
# ENDPOINT PARA ESCANEAR VARIAS IMÁGENES (OPCIONAL)
# ------------------------------------------

@app.post("/scan_multiple")
def scan_multiple():
    try:
        tipo = request.form.get("tipo")
        files = request.files.getlist("files")

        if tipo not in SYNONYMS:
            return jsonify({"error": "tipo inválido"}), 400

        if not files:
            return jsonify({"error": "No se enviaron imágenes"}), 400

        def process_single(file):
            bytes_ = file.read()
            text = ocr_image(bytes_)
            data = process_text(text, tipo)
            return {"nombre": file.filename, "ocr_raw": text, "datos": data}

        results = Parallel(n_jobs=-1)(
            delayed(process_single)(f) for f in files
        )

        return jsonify(results)

    except Exception as e:
        logging.error(f"Error procesando múltiples imágenes: {e}")
        return jsonify({"error": "Error procesando múltiples imágenes"}), 500


# ------------------------------------------
# MAIN
# ------------------------------------------

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8091, debug=True)
