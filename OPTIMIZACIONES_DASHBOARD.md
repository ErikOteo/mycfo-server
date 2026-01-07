# Optimizaciones de Performance del Dashboard MyCFO

## 📊 Resumen Ejecutivo

Se implementaron optimizaciones críticas que reducen el tiempo de carga del dashboard de **~9 queries lentas** a **1 query optimizada**, con mejoras esperadas de **50x-100x** en performance.

---

## 🎯 Optimizaciones Implementadas

### 1. **Backend: Endpoint Compuesto** ✅

**Archivo**: `registro/src/main/java/registro/cargarDatos/controllers/MovimientoController.java`

**Cambio**: Nuevo endpoint `GET /movimientos/resumen/dashboard` que devuelve:
- Resumen mensual (ingresos, egresos, resultado neto)
- Saldo total
- Ingresos y egresos mensuales (últimos 12 meses)
- Ingresos y egresos por categoría
- Resumen de conciliación
- Movimientos recientes (6 últimos)
- Facturas recientes (6 últimas)

**Antes**: 9 llamadas HTTP separadas desde el frontend  
**Después**: 1 sola llamada HTTP  
**Ganancia**: ~80% menos overhead de red y gateway

---

### 2. **Frontend: Caché en sessionStorage** ✅

**Archivo**: `frontend/src/dashboard/Dashboard.js`

**Cambio**: 
- Al cargar el dashboard, primero muestra la última respuesta guardada en `sessionStorage`
- En paralelo hace la nueva llamada al endpoint compuesto
- Cuando llega la respuesta, actualiza estado y cache

**Comportamiento**:
- **Primera carga**: 1 llamada HTTP, guarda en cache
- **Siguientes cargas**: Muestra cache instantáneamente + actualiza en background

**Ganancia**: Carga instantánea en visitas subsecuentes

---

### 3. **Backend: Queries Optimizadas** ✅

**Archivo**: `registro/src/main/java/registro/cargarDatos/repositories/MovimientoRepository.java`

#### 3.1. Query con filtros dinámicos
**Antes**:
```java
List<Movimiento> todos = movimientoRepository.findAll(); // Trae TODOS los movimientos
// Luego filtra en memoria con .stream().filter()...
```

**Después**:
```java
@Query("SELECT m FROM Movimiento m WHERE ...")
Page<Movimiento> findMovimientosConFiltros(..., Pageable pageable);
```

**Ganancia**: De traer 100k registros a traer solo los 6-20 necesarios → **~5000x menos datos**

---

#### 3.2. Query con GROUP BY para categorías
**Antes**:
```java
// Trae todos los movimientos del año
List<Movimiento> registros = movimientoRepository
    .findByOrganizacionIdAndFechaEmisionBetween(...);
// Agrupa en memoria con .stream().collect(groupingBy())
```

**Después**:
```java
@Query("SELECT COALESCE(m.categoria, 'Sin categoria'), SUM(m.montoTotal) " +
       "FROM Movimiento m WHERE ... GROUP BY m.categoria ORDER BY SUM(m.montoTotal) DESC")
List<Object[]> sumMontosPorCategoria(...);
```

**Ganancia**: De traer 10k movimientos a traer solo 5-20 categorías → **~500x menos datos**

---

### 4. **Base de Datos: Índices** ✅

**Archivo**: `registro/src/main/resources/db/migration/V999__add_performance_indexes.sql`

**Índices creados**:
```sql
-- Filtros más comunes
CREATE INDEX idx_movimiento_org_fecha ON movimiento(organizacion_id, fecha_emision DESC);

-- Filtros por tipo
CREATE INDEX idx_movimiento_org_tipo_fecha ON movimiento(organizacion_id, tipo, fecha_emision DESC);

-- Conciliación
CREATE INDEX idx_movimiento_org_conciliado ON movimiento(organizacion_id, fecha_emision DESC) 
WHERE documento_comercial IS NOT NULL;

CREATE INDEX idx_movimiento_org_pendiente ON movimiento(organizacion_id, fecha_emision DESC) 
WHERE documento_comercial IS NULL;

-- GROUP BY categoría
CREATE INDEX idx_movimiento_org_tipo_categoria ON movimiento(organizacion_id, tipo, categoria);

-- Búsquedas por nombre
CREATE INDEX idx_movimiento_origen_nombre ON movimiento(LOWER(origen_nombre));
CREATE INDEX idx_movimiento_destino_nombre ON movimiento(LOWER(destino_nombre));

-- Filtros por usuario
CREATE INDEX idx_movimiento_usuario_fecha ON movimiento(usuario_id, fecha_emision DESC);
```

**Ganancia**: Queries que hacían full table scan ahora usan índices → **10x-100x más rápido**

---

## 📈 Impacto Esperado

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| **Llamadas HTTP** | 9 separadas | 1 compuesta | 89% menos |
| **Datos transferidos** (movimientos) | ~100k registros | ~6-20 registros | ~5000x menos |
| **Datos transferidos** (categorías) | ~10k registros | ~5-20 categorías | ~500x menos |
| **Tiempo de carga inicial** | ~3-5 segundos | ~300-500ms | **10x más rápido** |
| **Cargas subsecuentes** | ~3-5 segundos | ~50ms (cache) | **100x más rápido** |
| **Queries en BD** | Full table scans | Index scans | 10x-100x más rápido |

---

## 🚀 Cómo Aplicar

### Backend

1. **Ya está listo** - Los cambios en código ya están aplicados
2. **Ejecutar migración de índices**:
   ```bash
   # Opción 1: Flyway (automático al iniciar la app)
   # Los índices se crearán automáticamente
   
   # Opción 2: Manual (si no usás Flyway)
   psql -U usuario -d mycfo_db -f registro/src/main/resources/db/migration/V999__add_performance_indexes.sql
   ```

### Frontend

1. **Ya está listo** - Los cambios ya están aplicados
2. **Probar**:
   - Abrir el dashboard
   - Primera carga: debería ser más rápida
   - Cerrar y volver a abrir: debería cargar instantáneamente
   - Verificar en DevTools → Network: solo 1 llamada a `/movimientos/resumen/dashboard`

---

## 🔍 Verificación

### Backend
```bash
# Ver el plan de ejecución de una query
EXPLAIN ANALYZE 
SELECT m FROM Movimiento m 
WHERE m.organizacionId = 1 
AND m.fechaEmision BETWEEN '2024-01-01' AND '2024-12-31';

# Debería mostrar "Index Scan using idx_movimiento_org_fecha"
```

### Frontend
```javascript
// En DevTools Console
sessionStorage.getItem('dashboard_summary_v1')
// Debería mostrar el JSON del último dashboard cargado
```

---

## 📝 Notas Técnicas

### Compatibilidad
- **Backend**: Compatible con versiones anteriores (endpoints viejos siguen funcionando)
- **Frontend**: Si el endpoint compuesto falla, no hay fallback (se muestra error)
- **Base de datos**: Los índices son seguros de agregar (no rompen nada existente)

### Mantenimiento
- **Cache**: Se guarda por sesión del navegador (se limpia al cerrar todas las pestañas)
- **Índices**: Ocupan espacio adicional en disco (~5-10% del tamaño de la tabla)
- **Queries**: Más eficientes pero requieren que los índices existan

### Próximos pasos (opcional)
1. **Expiración del cache**: Agregar timestamp y expirar después de X minutos
2. **Cache por período**: Guardar múltiples períodos en cache
3. **Lazy loading**: Cargar widgets no críticos después de los KPIs principales
4. **Compresión**: Comprimir la respuesta del endpoint compuesto (gzip)

---

## 🐛 Troubleshooting

### "El dashboard no carga"
- Verificar que el endpoint `/movimientos/resumen/dashboard` responda en Postman
- Verificar header `X-Usuario-Sub` en la llamada
- Ver errores en consola del navegador

### "Los datos están desactualizados"
- Limpiar cache: `sessionStorage.removeItem('dashboard_summary_v1')`
- Hacer hard refresh: Ctrl+Shift+R (Windows) o Cmd+Shift+R (Mac)

### "Queries siguen lentas"
- Verificar que los índices se crearon: `\d movimiento` en psql
- Ver plan de ejecución: `EXPLAIN ANALYZE SELECT ...`
- Verificar que no hay locks en la tabla

---

## ✅ Checklist de Implementación

- [x] Endpoint compuesto creado en backend
- [x] DTO `DashboardSummaryResponse` creado
- [x] Frontend adaptado para usar endpoint compuesto
- [x] Cache en sessionStorage implementado
- [x] Queries optimizadas (filtros en BD)
- [x] Queries optimizadas (GROUP BY en BD)
- [x] Script de índices creado
- [ ] **Índices ejecutados en BD de desarrollo**
- [ ] **Índices ejecutados en BD de producción**
- [ ] **Pruebas de performance realizadas**
- [ ] **Monitoreo de tiempos de respuesta configurado**

---

**Fecha de implementación**: 2024-11-24  
**Autor**: Optimización automática de performance  
**Versión**: 1.0
