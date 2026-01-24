import json
import re
import time
import vertexai
from google.auth import load_credentials_from_file
from vertexai.generative_models import GenerativeModel, Part

# =========================================================
# CONFIGURACIÓN
# =========================================================
CREDENTIALS_PATH = "D:/Proyectos/mycfo/mycfo-google.json"
LOCATION = "us-central1"
IMAGE_PATH = "factura2.png"

# =========================================================
# ESQUEMA CANÓNICO (fuente de verdad)
# =========================================================
EXPECTED_SCHEMA = {
    "tipoFactura": None,
    "vendedorNombre": None,
    "vendedorCuit": None,
    "vendedorCondicionIVA": None,
    "vendedorDomicilio": None,
    "compradorNombre": None,
    "compradorCuit": None,
    "compradorCondicionIVA": None,
    "compradorDomicilio": None,
}

# =========================================================
# UTILIDADES DE PARSEO ROBUSTO
# =========================================================
def normalize_schema(data: dict) -> dict:
    result = EXPECTED_SCHEMA.copy()
    if isinstance(data, dict):
        for k in result.keys():
            if k in data:
                result[k] = data[k]
    return result


def extract_and_fix_json(text: str) -> dict:
    if not text:
        return EXPECTED_SCHEMA.copy()

    text = re.sub(r"```[a-zA-Z]*", "", text)
    text = text.replace("```", "").strip()

    if "{" not in text:
        return EXPECTED_SCHEMA.copy()

    text = text[text.find("{"):]

    try:
        return normalize_schema(json.loads(text))
    except Exception:
        pass

    lines = []
    quote_balance = 0

    for line in text.splitlines():
        quote_balance += line.count('"')
        lines.append(line)

    repaired = "\n".join(lines)

    if quote_balance % 2 != 0:
        repaired += '"'

    open_braces = repaired.count("{")
    close_braces = repaired.count("}")
    if open_braces > close_braces:
        repaired += "}" * (open_braces - close_braces)

    repaired = re.sub(r",\s*}", "}", repaired)

    try:
        return normalize_schema(json.loads(repaired))
    except Exception:
        return EXPECTED_SCHEMA.copy()

# =========================================================
# ⏱️ TIMER GLOBAL
# =========================================================
t_start_total = time.perf_counter()

# =========================================================
# INIT VERTEX AI
# =========================================================
t_start_init = time.perf_counter()

creds, project = load_credentials_from_file(CREDENTIALS_PATH)

vertexai.init(
    project=project,
    location=LOCATION,
    credentials=creds
)

model = GenerativeModel("gemini-2.5-flash")

t_end_init = time.perf_counter()

# =========================================================
# CARGA DE IMAGEN
# =========================================================
t_start_image = time.perf_counter()

with open(IMAGE_PATH, "rb") as f:
    image_bytes = f.read()

image_part = Part.from_data(
    mime_type="image/png",
    data=image_bytes
)

t_end_image = time.perf_counter()

# =========================================================
# PROMPT
# =========================================================
prompt = """
Sos un sistema de extracción de datos fiscales.

Analizá la imagen de una FACTURA y devolvé exclusivamente los datos
que encuentres con esta estructura JSON:

{
  "tipoFactura": "",
  "vendedorNombre": "",
  "vendedorCuit": "",
  "vendedorCondicionIVA": "",
  "vendedorDomicilio": "",
  "compradorNombre": "",
  "compradorCuit": "",
  "compradorCondicionIVA": "",
  "compradorDomicilio": ""
}

Reglas:
- Si un dato no está presente, usar null
- No inventar datos
- No agregar texto fuera del JSON
- tipoFactura solo puede ser A, B, C, M o null
"""

# =========================================================
# LLAMADA A VERTEX (IA)
# =========================================================
t_start_ai = time.perf_counter()

response = model.generate_content(
    contents=[prompt, image_part],
    generation_config={
        "temperature": 0.0,
        "max_output_tokens": 1024
    }
)

t_end_ai = time.perf_counter()

# =========================================================
# PARSEO FINAL
# =========================================================
t_start_parse = time.perf_counter()

raw_text = response.text
data = extract_and_fix_json(raw_text)

t_end_parse = time.perf_counter()

# =========================================================
# ⏱️ FIN TIMER
# =========================================================
t_end_total = time.perf_counter()

# =========================================================
# OUTPUT
# =========================================================
print(json.dumps(data, indent=2, ensure_ascii=False))

print("\n⏱️ MÉTRICAS DE TIEMPO")
print(f"Init Vertex AI      : {t_end_init - t_start_init:.3f} s")
print(f"Carga de imagen     : {t_end_image - t_start_image:.3f} s")
print(f"Llamada a IA        : {t_end_ai - t_start_ai:.3f} s")
print(f"Parseo JSON         : {t_end_parse - t_start_parse:.3f} s")
print(f"TOTAL               : {t_end_total - t_start_total:.3f} s")
