"""
Script de depuracion para el Excel de Santander.
Lee excels-bancos-pruebas/santander.xlsx y muestra las filas que se detectan.
"""
import pandas as pd
import unicodedata
from pathlib import Path


def parse_monto(raw: str) -> float:
    if not raw or str(raw).strip() == "" or pd.isna(raw):
        return 0.0
    s = str(raw).replace("$", "").replace(" ", "")
    # si hay coma decimal, quitar puntos de miles
    if "," in s:
        s = s.replace(".", "")
        s = s.replace(",", ".")
    try:
        return float(s)
    except ValueError:
        return 0.0


def main():
    path = Path("excels-bancos-pruebas/santander.xlsx")
    if not path.exists():
        print(f"No existe {path}")
        return

    df = pd.read_excel(path, sheet_name=0, header=None)

    print("=== HEAD DEL ARCHIVO ===")
    print(df.head(30))

    # Buscar fila de encabezados (más flexible)
    header_idx = None
    for i, row in df.iterrows():
        vals = []
        for v in row:
            if pd.isna(v):
                continue
            vals.append(
                unicodedata.normalize("NFD", str(v))
                .encode("ascii", "ignore")
                .decode()
                .lower()
            )
        if not vals:
            continue
        tiene_fecha = any("fecha" in v for v in vals)
        tiene_desc = any("descripcion" in v for v in vals)
        tiene_caja = any("caja de ahorro" in v for v in vals)
        if tiene_fecha and tiene_desc and tiene_caja:
            header_idx = i
            break

    print(f"\nHeader detectado en fila: {header_idx}")

    movimientos = []
    if header_idx is not None:
        for i in range(header_idx + 1, len(df)):
            row = df.iloc[i]
            fecha = str(row[1]).strip() if not pd.isna(row[1]) else ""
            desc = str(row[3]).strip() if not pd.isna(row[3]) else ""
            ref = str(row[4]).strip() if not pd.isna(row[4]) else ""
            caja = row[5]
            cta = row[6]

            if not fecha or not desc:
                continue
            if "saldo" in desc.lower():
                break

            monto = parse_monto(caja) if parse_monto(caja) != 0 else parse_monto(cta)
            if monto == 0:
                continue

            movimientos.append(
                {
                    "fila": i + 1,
                    "fecha": fecha,
                    "descripcion": desc,
                    "referencia": ref,
                    "monto": monto,
                    "caja": caja,
                    "cta": cta,
                }
            )

    print(f"\n=== MOVIMIENTOS DETECTADOS ({len(movimientos)}) ===")
    for m in movimientos:
        print(
            f"fila={m['fila']} fecha={m['fecha']} desc=\"{m['descripcion']}\" ref={m['referencia']} "
            f"monto={m['monto']} caja={m['caja']} cta={m['cta']}"
        )


if __name__ == "__main__":
    main()
