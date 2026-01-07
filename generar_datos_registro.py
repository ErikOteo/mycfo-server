#!/usr/bin/env python3
"""
Generador de datos de prueba para la tabla registro
Genera movimientos de 2023, 2024 y 2025 (hasta noviembre)
con estacionalidad y tendencia creciente
"""

from datetime import datetime, timedelta
import random
import os

# Configuración - CAMBIAR AQUÍ PARA TODOS LOS INSERTS
ORGANIZACION_ID = 2
USUARIO_ID = 'a3bcba1a-f001-70eb-15ba-6a851dfe22ce'

# Set global para evitar números repetidos
FACTURAS_GENERADAS = set()

# Factores estacionales (multiplicadores por mes)
# Temporada ALTA: Nov-Dic-Ene (verano argentino) 1.3-1.4
# Temporada MEDIA: Feb-Mar-Abr-Oct 1.0-1.1
# Temporada BAJA: May-Jun-Jul-Ago-Sep 0.7-0.8
ESTACIONALIDAD = {
    1: 1.40,  # Enero - TEMPORADA ALTA (Verano)
    2: 1.10,  # Febrero - Media
    3: 1.05,  # Marzo - Media
    4: 1.00,  # Abril - Media
    5: 0.80,  # Mayo - Baja
    6: 0.70,  # Junio - TEMPORADA BAJA (Invierno)
    7: 0.65,  # Julio - TEMPORADA BAJA (Invierno)
    8: 0.70,  # Agosto - Baja
    9: 0.80,  # Septiembre - Baja
    10: 0.95,  # Octubre - Media
    11: 1.30,  # Noviembre - TEMPORADA ALTA (Pre-verano)
    12: 1.35,  # Diciembre - TEMPORADA ALTA (Verano)
}

# Categorías de ingresos con distribución
CATEGORIAS_INGRESO = [
    ('Prestación de Servicios', 0.50),  # 50% de los ingresos
    ('Ventas de Productos', 0.35),      # 35% de los ingresos
    ('Otros Ingresos', 0.15),           # 15% de los ingresos
]

# Categorías de egresos con distribución
CATEGORIAS_EGRESO = [
    ('Compras de Negocio', 0.70),  # 70% de los egresos
    ('Otros Egresos', 0.30),       # 30% de los egresos
]

# Bases iniciales para 2023
BASE_INGRESO_2023 = 400000
BASE_EGRESO_2023 = 180000

# Crecimiento anual (20% por año - más pronunciado)
CRECIMIENTO_ANUAL = 1.20

# Alquiler mensual base (se ajusta cada 6 meses)
ALQUILER_BASE_2023 = 150000

def generar_fechas_aleatorias(year, month, cantidad=15):
    """Genera N fechas aleatorias dentro de un mes"""
    if month == 2:
        ultimo_dia = 28 if year % 4 != 0 else 29
    elif month in [4, 6, 9, 11]:
        ultimo_dia = 30
    else:
        ultimo_dia = 31
    
    fechas = []
    for i in range(cantidad):
        dia = random.randint(1, ultimo_dia)
        hora = random.randint(9, 18)
        minuto = random.randint(0, 59)
        segundo = random.randint(0, 59)
        fecha = f"{year}-{month:02d}-{dia:02d} {hora:02d}:{minuto:02d}:{segundo:02d}"
        fechas.append(fecha)
    
    return sorted(fechas)

def calcular_alquiler(year, month):
    """Calcula el alquiler según el semestre"""
    years_desde_2023 = year - 2023
    semestre = (month - 1) // 6  # 0 = ene-jun, 1 = jul-dic
    
    # Crecimiento anual del alquiler (25% por año)
    factor_crecimiento = 1.25 ** years_desde_2023
    
    # Ajuste semestral adicional (5% cada 6 meses)
    factor_semestral = 1.05 ** semestre
    
    alquiler = ALQUILER_BASE_2023 * factor_crecimiento * factor_semestral
    return -round(alquiler / 1000) * 1000  # Negativo y redondeado a miles

def seleccionar_categoria(categorias):
    """Selecciona una categoría según su probabilidad"""
    rand = random.random()
    acumulado = 0
    for categoria, probabilidad in categorias:
        acumulado += probabilidad
        if rand <= acumulado:
            return categoria
    return categorias[-1][0]  # Fallback

def calcular_monto(base, year, month, index, tipo):
    """Calcula el monto con tendencia y estacionalidad"""
    # Aplicar crecimiento anual
    years_desde_2023 = year - 2023
    factor_crecimiento = CRECIMIENTO_ANUAL ** years_desde_2023
    
    # Aplicar estacionalidad
    factor_estacional = ESTACIONALIDAD[month]
    
    # Variación aleatoria entre registros (+/- 5%)
    variacion = random.uniform(0.95, 1.05)
    
    # Tendencia creciente dentro del mes
    factor_mes = 1 + (index * 0.015)
    
    monto = base * factor_crecimiento * factor_estacional * variacion * factor_mes
    
    # Redondear a múltiplos de 500
    monto = round(monto / 500) * 500
    
    # Si es egreso, hacer negativo
    if tipo == 'Egreso':
        monto = -abs(monto)
    
    return int(monto)

def generar_numero_factura():
    """
    Genera un número de factura aleatorio de 10 dígitos, 
    garantizando que no se repita dentro de la ejecución completa.
    """
    while True:
        numero = random.randint(1000000000, 9999999999)  # 10 dígitos
        if numero not in FACTURAS_GENERADAS:
            FACTURAS_GENERADAS.add(numero)
            return str(numero)


MESES = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
]

def generar_item_vinculado(tipo, monto, fecha, categoria, origen_nombre, origen_cuit, 
                           destino_nombre, destino_cuit, descripcion, medio_pago,
                           vendedor_nombre, vendedor_cuit, comprador_nombre, comprador_cuit):
    """Genera SQL para documento_comercial + factura + registro vinculados"""
    numero_factura = generar_numero_factura()

    monto_doc = abs(monto)
    
    sql = (
        f"-- Documento + Registro vinculado\n"
        f"INSERT INTO documento_comercial (\n"
        f"    tipo_documento, numero_documento,\n"
        f"    fecha_emision, monto_total, moneda, categoria,\n"
        f"    version_documento, fecha_creacion, fecha_actualizacion,\n"
        f"    usuario_id, organizacion_id\n"
        f") VALUES (\n"
        f"    'FACTURA', '{numero_factura}',\n"
        f"    '{fecha[:10]}', {monto_doc}, 'ARS', '{categoria}',\n"
        f"    'Original', '{fecha[:10]}', '{fecha[:10]}',\n"
        f"    @USUARIO_ID, @ORGANIZACION_ID\n"
        f");\n"
        f"SET @DOCUMENTO_ID = LAST_INSERT_ID();\n"
        f"INSERT INTO factura (\n"
        f"    id_documento, tipo_factura,\n"
        f"    vendedor_nombre, vendedor_cuit, vendedor_condicioniva, vendedor_domicilio,\n"
        f"    comprador_nombre, comprador_cuit, comprador_condicioniva, comprador_domicilio,\n"
        f"    estado_pago\n"
        f") VALUES (\n"
        f"    @DOCUMENTO_ID, 'A',\n"
        f"    '{vendedor_nombre}', '{vendedor_cuit}', 'Responsable Inscripto', 'Direccion Vendedor',\n"
        f"    '{comprador_nombre}', '{comprador_cuit}', 'Responsable Inscripto', 'Direccion Comprador',\n"
        f"    'PAGADO'\n"
        f");\n"
        f"INSERT INTO registro_db.registro (\n"
        f"    tipo, monto_total, fecha_emision, categoria,\n"
        f"    origen_nombre, origen_cuit, destino_nombre, destino_cuit,\n"
        f"    descripcion, fecha_creacion, fecha_actualizacion,\n"
        f"    usuario_id, organizacion_id, medio_pago, moneda,\n"
        f"    fecha_vencimiento, monto_pagado, cantidad_cuotas,\n"
        f"    cuotas_pagadas, monto_cuota, tasa_interes, periodicidad,\n"
        f"    estado, id_documento\n"
        f") VALUES (\n"
        f"    '{tipo}', {monto}, '{fecha}', '{categoria}',\n"
        f"    '{origen_nombre}', '{origen_cuit}', '{destino_nombre}', '{destino_cuit}',\n"
        f"    '{descripcion}', '{fecha[:10]}', '{fecha[:10]}',\n"
        f"    @USUARIO_ID, @ORGANIZACION_ID, '{medio_pago}', 'ARS',\n"
        f"    NULL, NULL, NULL, NULL, NULL, NULL, NULL,\n"
        f"    'PAGADO', @DOCUMENTO_ID\n"
        f");\n"
    )
    return sql

def generar_item_sin_vincular(tipo, monto, fecha, categoria, origen_nombre, origen_cuit,
                               destino_nombre, destino_cuit, descripcion, medio_pago):
    """Genera SQL solo para registro sin vincular"""
    sql = (
        f"-- Registro sin vincular\n"
        f"INSERT INTO registro_db.registro (\n"
        f"    tipo, monto_total, fecha_emision, categoria,\n"
        f"    origen_nombre, origen_cuit, destino_nombre, destino_cuit,\n"
        f"    descripcion, fecha_creacion, fecha_actualizacion,\n"
        f"    usuario_id, organizacion_id, medio_pago, moneda,\n"
        f"    fecha_vencimiento, monto_pagado, cantidad_cuotas,\n"
        f"    cuotas_pagadas, monto_cuota, tasa_interes, periodicidad,\n"
        f"    estado, id_documento\n"
        f") VALUES (\n"
        f"    '{tipo}', {monto}, '{fecha}', '{categoria}',\n"
        f"    '{origen_nombre}', '{origen_cuit}', '{destino_nombre}', '{destino_cuit}',\n"
        f"    '{descripcion}', '{fecha[:10]}', '{fecha[:10]}',\n"
        f"    @USUARIO_ID, @ORGANIZACION_ID, '{medio_pago}', 'ARS',\n"
        f"    NULL, NULL, NULL, NULL, NULL, NULL, NULL,\n"
        f"    'PAGADO', NULL\n"
        f");\n"
    )
    return sql

def generar_factura_sin_vincular(monto, fecha, categoria, vendedor_nombre, vendedor_cuit,
                                  comprador_nombre, comprador_cuit):
    """Genera SQL para factura sin vincular a registro"""
    numero_factura = generar_numero_factura()

    monto_doc = abs(monto)
    
    sql = (
        f"-- Factura sin vincular\n"
        f"INSERT INTO documento_comercial (\n"
        f"    tipo_documento, numero_documento,\n"
        f"    fecha_emision, monto_total, moneda, categoria,\n"
        f"    version_documento, fecha_creacion, fecha_actualizacion,\n"
        f"    usuario_id, organizacion_id\n"
        f") VALUES (\n"
        f"    'FACTURA', '{numero_factura}',\n"
        f"    '{fecha[:10]}', {monto_doc}, 'ARS', '{categoria}',\n"
        f"    'Original', '{fecha[:10]}', '{fecha[:10]}',\n"
        f"    @USUARIO_ID, @ORGANIZACION_ID\n"
        f");\n"
        f"SET @DOCUMENTO_ID = LAST_INSERT_ID();\n"
        f"INSERT INTO factura (\n"
        f"    id_documento, tipo_factura,\n"
        f"    vendedor_nombre, vendedor_cuit, vendedor_condicioniva, vendedor_domicilio,\n"
        f"    comprador_nombre, comprador_cuit, comprador_condicioniva, comprador_domicilio,\n"
        f"    estado_pago\n"
        f") VALUES (\n"
        f"    @DOCUMENTO_ID, 'A',\n"
        f"    '{vendedor_nombre}', '{vendedor_cuit}', 'Responsable Inscripto', 'Direccion Vendedor',\n"
        f"    '{comprador_nombre}', '{comprador_cuit}', 'Responsable Inscripto', 'Direccion Comprador',\n"
        f"    'PAGADO'\n"
        f");\n"
    )
    return sql

def generar_mes_intercalado(year, month, base_ingreso, base_egreso, es_noviembre_2025=False):
    """Genera SQL intercalado: documento + factura + registro juntos"""
    items_sql = []
    facturas_sin_vincular_sql = []
    
    mes_nombre = MESES[month - 1]
    num_ingresos = 15
    num_egresos = 12
    ingresos_sin_vincular = [13, 14] if es_noviembre_2025 else []
    egresos_sin_vincular = [11] if es_noviembre_2025 else []
    
    fechas_ingresos = generar_fechas_aleatorias(year, month, num_ingresos)
    fechas_egresos = generar_fechas_aleatorias(year, month, num_egresos)
    
    estacion = ""
    if month in [11, 12, 1]:
        estacion = " (TEMPORADA ALTA - Verano)"
    elif month in [6, 7]:
        estacion = " (TEMPORADA BAJA - Invierno)"
    
    items_sql.append(f"\n-- {mes_nombre.upper()} {year}{estacion}\n")
    
    # Generar ingresos
    for i in range(num_ingresos):
        monto = calcular_monto(base_ingreso, year, month, i, 'Ingreso')
        fecha = fechas_ingresos[i]
        categoria = seleccionar_categoria(CATEGORIAS_INGRESO)
        
        if categoria == 'Prestación de Servicios':
            origen_nombre = 'Cliente Corporativo SA'
            origen_cuit = '30-42998817-4'
        elif categoria == 'Ventas de Productos':
            origen_nombre = 'Consumidor Final'
            origen_cuit = '30-42998817-4'
        else:
            origen_nombre = 'Otros'
            origen_cuit = '30-42998817-4'
        
        descripcion = f"{categoria} {mes_nombre} {year} #{i+1}"
        sin_vincular = i in ingresos_sin_vincular
        
        if not sin_vincular:
            sql = generar_item_vinculado(
                'Ingreso', monto, fecha, categoria,
                origen_nombre, origen_cuit, 'MyCFO SRL', '30-99999999-7',
                descripcion, 'Transferencia',
                'MyCFO SRL', '30-99999999-7', origen_nombre, origen_cuit
            )
            items_sql.append(sql)
        else:
            sql = generar_item_sin_vincular(
                'Ingreso', monto, fecha, categoria,
                origen_nombre, origen_cuit, 'MyCFO SRL', '30-99999999-7',
                descripcion, 'Transferencia'
            )
            items_sql.append(sql)
            factura_sql = generar_factura_sin_vincular(
                monto, fecha, categoria,
                'MyCFO SRL', '30-99999999-7', origen_nombre, origen_cuit
            )
            facturas_sin_vincular_sql.append(factura_sql)
    
    # Generar egresos
    for i in range(num_egresos):
        monto = calcular_monto(base_egreso, year, month, i, 'Egreso')
        fecha = fechas_egresos[i]
        categoria = seleccionar_categoria(CATEGORIAS_EGRESO)
        
        if categoria == 'Compras de Negocio':
            destino_nombre = 'Proveedor Mayorista SRL'
            destino_cuit = '30-19837465-3'
        else:
            destino_nombre = 'Gastos Varios'
            destino_cuit = '30-19837465-3'
        
        descripcion = f"{categoria} {mes_nombre} {year} #{i+1}"
        sin_vincular = i in egresos_sin_vincular
        
        if not sin_vincular:
            sql = generar_item_vinculado(
                'Egreso', monto, fecha, categoria,
                'MyCFO SRL', '30-99999999-7', destino_nombre, destino_cuit,
                descripcion, 'Efectivo',
                destino_nombre, destino_cuit, 'MyCFO SRL', '30-99999999-7'
            )
            items_sql.append(sql)
        else:
            sql = generar_item_sin_vincular(
                'Egreso', monto, fecha, categoria,
                'MyCFO SRL', '30-99999999-7', destino_nombre, destino_cuit,
                descripcion, 'Efectivo'
            )
            items_sql.append(sql)
            factura_sql = generar_factura_sin_vincular(
                monto, fecha, categoria,
                destino_nombre, destino_cuit, 'MyCFO SRL', '30-99999999-7'
            )
            facturas_sin_vincular_sql.append(factura_sql)
    
    # Alquiler mensual
    alquiler = calcular_alquiler(year, month)
    fecha_alquiler = f"{year}-{month:02d}-05 10:00:00"
    sql = generar_item_vinculado(
        'Egreso', alquiler, fecha_alquiler, 'Vivienda',
        'MyCFO SRL', '30-99999999-7', 'Inmobiliaria Central', '30-12345678-9',
        f'Alquiler local comercial {mes_nombre} {year}', 'Transferencia',
        'Inmobiliaria Central', '30-12345678-9', 'MyCFO SRL', '30-99999999-7'
    )
    items_sql.append(sql)
    
    return items_sql, facturas_sin_vincular_sql

def generar_sql_completo():
    """Genera el archivo SQL completo con inserts intercalados"""
    output = []
    
    header = f"""
-- ========================================
-- CONFIGURACIÓN
-- ========================================
SET @ORGANIZACION_ID = {ORGANIZACION_ID};
SET @USUARIO_ID = '{USUARIO_ID}';

-- ========================================
-- DATOS INTERCALADOS (documento + factura + registro)
-- Los IDs se generan automáticamente por la base de datos
-- Cada registro se vincula inmediatamente con su documento usando LAST_INSERT_ID()
-- ========================================
"""
    output.append(header)
    
    todas_facturas_sin_vincular = []
    
    # 2023
    for month in range(1, 13):
        items, facturas_sv = generar_mes_intercalado(2023, month, BASE_INGRESO_2023, BASE_EGRESO_2023, False)
        output.extend(items)
    
    # 2024
    base_ingreso_2024 = BASE_INGRESO_2023 * CRECIMIENTO_ANUAL
    base_egreso_2024 = BASE_EGRESO_2023 * CRECIMIENTO_ANUAL
    for month in range(1, 13):
        items, facturas_sv = generar_mes_intercalado(2024, month, base_ingreso_2024, base_egreso_2024, False)
        output.extend(items)
    
    # 2025 hasta noviembre
    base_ingreso_2025 = base_ingreso_2024 * CRECIMIENTO_ANUAL
    base_egreso_2025 = base_egreso_2024 * CRECIMIENTO_ANUAL
    for month in range(1, 12):
        es_nov_2025 = (month == 11)
        items, facturas_sv = generar_mes_intercalado(2025, month, base_ingreso_2025, base_egreso_2025, es_nov_2025)
        output.extend(items)
        if es_nov_2025:
            todas_facturas_sin_vincular.extend(facturas_sv)
    
    # Facturas sin vincular
    if todas_facturas_sin_vincular:
        output.append("\n-- ========================================")
        output.append("-- FACTURAS SIN VINCULAR (Noviembre 2025)")
        output.append("-- Para conciliar manualmente")
        output.append("-- ========================================\n")
        output.extend(todas_facturas_sin_vincular)
    
    # Información final
    output.append("\n-- ========================================")
    output.append("-- INFORMACIÓN")
    output.append("-- ========================================")
    output.append("-- Los IDs de documento_comercial se generaron automáticamente")
    output.append("-- La secuencia de Hibernate se sincronizará automáticamente")
    output.append("SELECT COUNT(*) AS total_documentos_insertados FROM documento_comercial;")
    output.append("SELECT COUNT(*) AS total_registros_insertados FROM registro_db.registro;")
    
    return '\n'.join(output)

if __name__ == '__main__':
    sql = generar_sql_completo()
    
    # Obtener el directorio donde está este script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_file = os.path.join(script_dir, 'init registro - completo.sql')
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(sql)
    
    print("✅ Archivo 'init registro - completo.sql' generado exitosamente!")
    print(f"📁 Ubicación: {output_file}")
    print(f"📊 Total de registros: {35 * 28} (35 meses × 28 registros/mes)")
    print("   - 15 ingresos por mes")
    print("   - 12 egresos variables por mes")
    print("   - 1 alquiler fijo mensual")
    print(f"📄 Total de documentos comerciales: {35 * 28} (35 meses × 28 facturas/mes)")
    print("")
    print("🔗 FORMATO INTERCALADO:")
    print("   - Cada documento_comercial + factura + registro se insertan JUNTOS")
    print("   - Los IDs se generan AUTOMÁTICAMENTE por la base de datos")
    print("   - @DOCUMENTO_ID = LAST_INSERT_ID() después de cada INSERT en documento_comercial")
    print("   - El registro usa @DOCUMENTO_ID para vincularse correctamente")
    print("   - NO usa secuencia manual, la base de datos maneja los IDs automáticamente")
    print("")
    print("🔗 Noviembre 2025 - Datos para conciliación manual:")
    print("   - 2 ingresos SIN vincular (id_documento = NULL)")
    print("   - 1 egreso SIN vincular (id_documento = NULL)")
    print("   - 3 facturas SIN vincular (para machear manualmente)")
    print("")
    print("📅 Período: Enero 2023 - Noviembre 2025")
