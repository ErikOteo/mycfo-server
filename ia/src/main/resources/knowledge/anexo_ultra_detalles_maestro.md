# 🚀 Anexo de Ultra-Detalles Funcionales (MyCFO)

Este documento contiene los "detalles de oro" técnicos y operativos que elevan la documentación de un nivel informativo a un nivel de maestría. Está diseñado para ser copiado y pegado dentro de las secciones correspondientes de tu guía principal.

---

## 1. Módulo: Carga de Datos (/carga)

### Pantalla: Nivel 3 - Motor Unificado
#### Sección: Formulario Manual
- **Validación del Monto**: El sistema bloquea carácteres no numéricos en tiempo real. Soporta hasta 2 decimales. Para montos mayores a un millón, se recomienda verificar la cantidad de ceros; el sistema no aplica puntos de mil automáticamente mientras escribís para evitar confusiones de edición.
- **Formato de Fecha**: Aunque ves `DD/MM/YYYY`, el sistema lo procesa internamente como ISO para asegurar que tu reporte de fin de año no tenga errores de zona horaria.
- **Regla de Facturas**: Al elegir "Factura", los campos de "Vendedor" y "Comprador" son dinámicos. El sistema busca en tu base de datos de contactos previa para sugerir nombres y autocompletar CUITs.

#### Sección: Modo Foto (IA/OCR)
- **Umbral de Calidad**: Si la foto está muy borrosa, el motor de IA podría fallar. **Tip Pro:** Asegurate de que las 4 esquinas de la factura sean visibles.
- **Detección de Subtotales**: El OCR está entrenado para distinguir entre Netos, IVAs y Percepciones. Si hay una discrepancia de centavos en la suma, el sistema te lo marcará con un borde naranja en el diálogo de revisión.

#### Sección: Modo Audio (Lenguaje Natural)
- **Diccionario Financiero**: La IA entiende palabras como "Luca" ($1.000), "Gamba" ($100) y "Palo" ($1.000.000). 
- **Modo Silencioso**: Si cancelás la grabación con la "X", el archivo de audio se elimina permanentemente del navegador por razones de privacidad y no se envía al servidor.

---

## 2. Módulo: Dashboard (/dashboard)

### Pantalla: Principal
#### Sección: Barra de Acciones Rápidas
- **Comportamiento Sticky**: En computadoras, la barra se "ancla" al tope de la pantalla al hacer scroll. En móviles, se transforma en un botón flotante (+) para maximizar el espacio de lectura.

#### Sección: Widgets de Presupuesto
- **Cálculo de Progreso**: La barra de progreso no solo mide dinero, mide **tiempo vs dinero**. Si estás a mitad de mes y ya gastaste el 80% del presupuesto, la barra cambiará a un color de advertencia aunque no hayas llegado al 100%.

#### Sección: Sincronización (Botón Recargar)
- **Invalidad de Caché**: Este botón no solo refresca la vista; obliga a todos los microservicios a recalcular tus saldos desde la base de datos raíz. Usalo solo cuando acabes de importar un Excel masivo.

---

## 3. Módulo: Movimientos y Facturas (/ver-movimientos)

### Pantalla: Tabla DataGrid
#### Sección: Búsqueda y Filtros
- **Lógica de Fechas**: Si escribís "15/05", el sistema asume el año actual. Si escribís solo un nombre (ej: "Galicia"), el sistema busca en Descripción, Origen y Destino simultáneamente.
- **Filtro de Montos**: El slider de montos es **logarítmico**. Esto significa que es más sensible en montos bajos (donde hay más movimientos) y menos sensible en montos altísimos para que puedas filtrar con precisión.

#### Sección: Exportación
- **Zebra Styling en Excel**: Los archivos exportados vienen con formato de tabla profesional. Si aplicás un filtro en la pantalla, el Excel **solo contendrá esos datos filtrados**, no toda la base de datos.

---

## 4. Módulo: Conciliación (/conciliacion)

### Pantalla: Panel de Trabajo
#### Sección: Sugerencias de IA
- **Margen de Tolerancia**: El sistema busca facturas con una diferencia de hasta **3 días** respecto a la fecha del movimiento y una diferencia de hasta **0,5%** en el monto (para cubrir pequeñas comisiones bancarias no declaradas).
- **Vínculos Múltiples**: Actualmente, la conciliación es 1 a 1. Si un movimiento cubre dos facturas, debés editar el movimiento para dividirlo o usar la nota de descripción para aclarar el vínculo manual.

---

## 5. Módulo: Presupuestos (/presupuestos)

### Pantalla: Creación (Wizard)
#### Sección: Regla de Cuotas
- **Interés Francés**: Si elegís carga en cuotas con interés, el sistema calcula el valor de la cuota usando la fórmula: `Cuota = (Capital * i) / (1 - (1+i)^-n)`. Esto asegura que tu proyección de egresos sea exacta a la de un crédito bancario real.

#### Sección: Semáforo de Salud
- **Rojo Crítico**: Se activa automáticamente cuando el gasto real supera el estimado en un **1%**. 
- **Amarillo de Alerta**: Se activa cuando el gasto real está entre el **80% y el 99.9%** del presupuesto.

---

## 6. Módulo: Pronósticos (/pronostico)

### Pantalla: Continuo y Fijo
#### Sección: Área Sombreada del Gráfico
- **Significado del Azul**: La zona azul no es solo decorativa; representa la **incertidumbre predictiva**. Cuanto más lejos en el futuro mires (ej: año 5), más ancha o variable podría ser la tendencia según tus datos históricos.
- **Efecto de Limpieza**: Al cambiar de ARS a USD, el gráfico desaparece. Esto se hace para evitar que el usuario tome decisiones basadas en una moneda con diferente volatilidad e inflación sin recalcular el modelo.

---

## 7. Módulo: Seguridad y Administración (/roles)

### Pantalla: Matriz de Permisos
#### Sección: Lógica de Cascada
- **Integración App**: Los permisos no son solo visuales. Si bloqueás "Reportes", el servidor rechazará cualquier intento de descarga de PDF aunque el usuario conozca la URL técnica de descarga.
- **Modo Lectura Profundo**: El permiso "Solo Lectura" bloquea incluso la aparición de los botones de "Editar" y "Eliminar" en las tablas de movimientos, evitando la tentación de modificar datos.

---

## 8. Módulo: Organización (/organizacion)

### Pantalla: Gestión de Empleados
#### Sección: Auto-Protección de Admins
- **El Botón Gris**: Si sos el único administrador de la organización, el botón de "Eliminar" de tu propia fila estará deshabilitado. Esto es una medida de seguridad "Pail-Safe" para evitar que una organización quede acéfala y nadie pueda recuperar la cuenta.

#### Sección: Paginación de Equipo
- **Límite Visual**: Mostramos 3 empleados por vez para mantener la fluidez en dispositivos móviles. En PC, podés cambiar a 10 o 25 si tenés una estructura corporativa más amplia.

---

## 9. Módulo: Perfil (/perfil)

### Pantalla: Personalización
#### Sección: Sincronización de Avatar
- **Dispatch Global**: Al cambiar tu color de avatar, el sistema lanza un "Event Dispatcher" que actualiza todos los componentes de la interfaz en milisegundos sin recargar la página. Es un cambio puramente estético que no afecta tus permisos pero sí cómo te ven los demás en los registros de auditoría.

#### Sección: Portabilidad JSON
- **Estructura del Backup**: El archivo JSON descargado contiene metadatos de tu sesión actual. Es una "foto" de tu identidad digital en MyCFO útil para soporte técnico avanzado.
