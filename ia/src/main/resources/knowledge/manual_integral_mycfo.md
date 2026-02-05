Introducción y Autenticación de MyCFO
Bienvenido a MyCFO, la plataforma inteligente diseñada para centralizar, simplificar y potenciar la gestión financiera de tu organización. Este manual sirve como puerta de entrada para entender el propósito del sistema y dominar los mecanismos de acceso seguro.

1. Introducción al Ecosistema MyCFO
1.1. Acerca de MyCFO
MyCFO es una solución integral de gestión financiera basada en la nube que combina herramientas administrativas tradicionales con inteligencia artificial avanzada. La plataforma actúa como un "Director Financiero Virtual" (CFO), permitiendo a los usuarios no solo registrar movimientos y facturas, sino también obtener análisis predictivos, proyecciones de flujo de caja y recomendaciones estratégicas en tiempo real.

1.2. Objetivos del Sistema
MyCFO fue concebido con cuatro pilares fundamentales:

Centralización Absoluta: Unificar en un solo lugar extractos bancarios, facturas fiscales, presupuestos y saldos de billeteras virtuales (como Mercado Pago).
Reducción de Tiempo Administrativo: Automatizar tareas repetitivas mediante OCR (lectura de fotos), transcripción de audio y mapeo inteligente de archivos Excel.
Transparencia y Control: Proporcionar una visión clara del "margen real" de la empresa, separando lo contable (facturado) de lo financiero (movimiento real de dinero).
Inteligencia Preventiva: Alertar sobre posibles desvíos presupuestarios o falta de liquidez mucho antes de que ocurran.
1.3. Público Objetivo
La plataforma es altamente escalable y se adapta a diferentes perfiles:

Freelancers y Profesionales Independientes: Para llevar un control ordenado de sus cobranzas y gastos sin necesidad de ser expertos contables.
Startups en Crecimiento: Para gestionar presupuestos dinámicos y rondas de inversión con reportes de P&L profesionales.
PYMEs: Para integrar equipos de administración con permisos granulares y automatizar el flujo de carga masiva de bancos.
1.4. Alcance del Manual
Este documento cubre exclusivamente los procesos de configuración inicial y seguridad de acceso. Define las bases técnicas mínimas para que la experiencia de usuario sea fluida y los pasos exactos para crear y activar la identidad digital del usuario en MyCFO.

1.5. Requisitos del Sistema
Para garantizar el correcto funcionamiento de los gráficos dinámicos y el motor de IA, se recomiendan los siguientes parámetros técnicos:

Componente	Requisito Mínimo	Recomendado
Navegador	Chrome 90+, Edge 90+, Firefox 88+	Google Chrome (Última versión)
Conexión a Internet	5 Mbps	20 Mbps o superior (Deseable para carga de PDFs)
Resolución de Pantalla	1366 x 768 px	1920 x 1080 px (Optimizado para modo Desktop)
Sistemas Operativos	Windows 10+, macOS, Linux	Indiferente (Acceso vía Navegador)
2. Inicio y Autenticación
2.1. Iniciar Sesión (/signin)
El acceso a MyCFO es la primera barrera de seguridad de tus datos financieros.

Credenciales: Debés ingresar el correo electrónico con el que te registraste y tu contraseña secreta.
Permanecer conectado: Si activás esta opción, el sistema genera un "token de refresco" que evita que tengas que re-ingresar tus datos cada vez que cerrás la pestaña (válido por 14 días).
Validación: El sistema bloquea el acceso tras 5 intentos fallidos consecutivos para prevenir ataques de fuerza bruta.
2.2. Crear Cuenta Nueva (/signup)
El proceso de Onboarding inicial es sencillo pero riguroso:

Datos Personales: Ingresá tu nombre completo y email corporativo o personal.
Identidad de Organización: Debés asignar un nombre inicial a tu "Organización". Esta será la entidad legal bajo la cual se agruparán tus datos.
Elección de Contraseña: Se requiere una clave robusta (alfanumérica).
Aceptación de Términos: El registro implica la aceptación de las políticas de privacidad y manejo de datos financieros.
2.3. Confirmar Usuario Creado
Por razones de seguridad, ninguna información puede cargarse hasta que el correo sea verificado:

El Correo de Activación: Recibirás un email automático de MyCFO con un enlace único.
Vencimiento: El enlace de activación expira a las 24 horas de generado. Si vence, deberás solicitar un nuevo envío desde la pantalla de login.
Efecto: Una vez que haces clic, tu estado cambia a "Confirmado" y el sistema te redirige automáticamente al Dashboard para comenzar la configuración de tu perfil.
2.4. Recuperar Contraseña
Si olvidaste tu clave, MyCFO tiene un flujo de recuperación seguro:

En la pantalla de LogIn, hacé clic en "¿Olvidaste tu contraseña?".
Ingresá tu correo electrónico registrado.
Token de Reseteo: Recibirás un código o link por email.
Nueva Clave: Al ingresar por el link de recuperación, el sistema te obligará a definir una contraseña nueva que no haya sido usada anteriormente.
2.5. Cerrar Sesión (Seguridad en la Salida)
Es vital salir del sistema correctamente si compartís equipo de trabajo:

Ubicación: El botón de "Cerrar Sesión" se encuentra en el menú desplegable del perfil (esquina superior derecha).
Efecto Técnico: Al cerrar sesión, el sistema borra instantáneamente los tokens de la memoria del navegador y del almacenamiento local (localStorage), asegurando que nadie pueda "volver atrás" en el historial para ver tus números.
Auto-Logout: Por inactividad prolongada (2 horas sin movimientos), MyCFO cerrará tu sesión automáticamente para proteger tu información sensible.
Guía Maestra de Carga de Datos y Movimientos (/carga)
Esta guía proporciona una explicación ultra-detallada de cada pantalla, botón y funcionalidad dentro del módulo de Carga de Datos. El sistema MyCFO utiliza una arquitectura de tres niveles para garantizar que la recolección de información financiera sea lo más flexible y automatizada posible.

1. Nivel 1: Selección de Tipo de Registro (/carga)
Esta es la puerta de entrada. El usuario ve una interfaz limpia con tarjetas interactivas grandes.

Lo que ve el usuario:
Título: "Registro de Documentos y Movimientos".
Subtítulo: "Elegí qué tipo de registro querés cargar".
Tarjetas de Selección: Cinco botones grandes (ButtonBase) con iconos representativos.
Botones y Funcionalidades:
Ingreso: Para registrar entradas de dinero que no son facturas (ej. aportes, otros ingresos).
Icono: Flecha hacia arriba (TrendingUp).
Egreso: Para registrar gastos inmediatos.
Icono: Flecha hacia abajo (TrendingDown).
Deuda: Para registrar compromisos de pago futuros.
Icono: Edificio de banco (AccountBalance).
Acreencia: Para registrar dinero que terceros te deben.
Icono: Billetera (Wallet).
Factura: Para carga detallada de comprobantes fiscales (vendedor, comprador, IVA, etc.).
Icono: Recibo (Receipt).
2. Nivel 2: Selección de Método (/carga/:tipo)
Una vez elegido el "qué", elegimos el "cómo". MyCFO ofrece cuatro vías de entrada.

Lo que ve el usuario:
Título: "Selección de método".
Subtítulo dinámico: Ej. "Elegí cómo querés cargar tu ingreso".
Métodos Disponibles:
Formulario: Entrada manual tradicional. Ideal para datos rápidos y precisos.
Icono: Lápiz (
Edit
).
Documento: Carga masiva mediante archivos Excel (.xlsx, .xls) o 
.csv
.
Icono: Documento de texto (Description).
Foto: Procesamiento mediante IA de una imagen (captura con cámara o archivo).
Icono: Cámara (CameraAlt).
Audio: Registro por voz. La IA transcribe y extrae los datos financieros.
Icono: Micrófono (Mic).
3. Nivel 3: El Motor de Procesamiento Unificado (/carga/:tipo/:modo)
Esta pantalla (
CargaVistaFinal.js
) es el cerebro del módulo. Adapta su interfaz según el método elegido.

A. Modo Formulario (/carga/:tipo/formulario)
El usuario ve un formulario específico para el tipo seleccionado.

Campos Obligatorios:
General: Monto Total y Fecha de Emisión.
Facturas: Número de documento, versión, tipo de factura, categoría, vendedor y comprador.
Funcionalidades:
Validación en tiempo real: Los campos se marcan en rojo si faltan datos al intentar enviar.
Normalización: El sistema convierte automáticamente comas en puntos y asegura el formato de fecha ISO para el backend.
Moneda: Por defecto selecciona ARS, pero permite el cambio.
Botones:
Enviar [Tipo]: Botón principal (CustomButton) que dispara la validación y el envío al endpoint /api/carga-datos.
B. Modo Documento (/carga/:tipo/documento)
Interfaz de carga masiva.

Lo que ve el usuario: Una zona de arrastrar y soltar (DropzoneUploader).
Funcionalidades:
Selección de archivo: Soporta Excel (.xlsx, .xls) y CSV.
Resumen de Importación: Tras la carga, aparece un cuadro con:
Total de filas procesadas.
Movimientos guardados con éxito.
Lista de errores detallada (ej. "Fila 5: Monto inválido").
Botones:
Subir documento: Procesa el archivo en el servidor.
C. Modo Foto (/carga/:tipo/foto)
Integración con la cámara y OCR (reconocimiento óptico).

Lo que ve el usuario: La señal en vivo de su webcam/cámara del celular.
Botones Interactivos sobre la cámara:
Cámara (Icono): Captura la imagen actual.
Botón "Subir imagen desde PC": Permite elegir un archivo local si no se usa la cámara.
Flujo de Confirmación:
Al capturar, aparecen dos nuevos botones: Cerrar (X rojo) para descartar y Check (Verde) para aceptar.
Procesamiento IA:
Al enviar, la IA analiza la foto. Si detecta datos, abre automáticamente un Diálogo de Revisión con los campos pre-completados (Monto, Fecha, Proveedor).
D. Modo Audio (/carga/:tipo/audio)
Entrada por lenguaje natural.

Lo que ve el usuario: Un botón circular gigante de color azul (BigRecordButton).
Interacción:
Click en Micrófono: Inicia la grabación. El botón se vuelve rojo y comienza una animación de pulso para indicar que el sistema está escuchando.
Click en Cerrar (X): Detiene la grabación.
Acciones post-grabación:
Aparece un reproductor de audio para que el usuario escuche lo grabado.
Enviar audio: Manda la grabación al motor de IA.
Resultado:
La IA transcribe el audio (ej: "Ayer gasté 5000 pesos en papelería").
Extrae el monto (5000), la fecha (ayer) y la categoría (papelería) y los precarga en el formulario de confirmación.
4. El Diálogo de Confirmación (Vista Previa)
Tanto en Foto como en Audio, el sistema no guarda nada sin que el usuario lo revise.

Elementos del Diálogo:
Mensaje de Estado: "Revisá y completá la información detectada".
Vista Previa Visual: Si es una factura, muestra un resumen formateado del comprobante detectado.
Formulario Editable: Todos los campos extraídos por la IA se pueden corregir manualmente.
Botón Consolidar/Enviar: Confirma que los datos son correctos y los guarda en la base de datos permanente de MyCFO.
5. Lógica Técnica y Endpoints
El sistema redirige las peticiones a endpoints específicos de la API de Registro:

Facturas: /facturas/documento, /facturas/foto, /api/carga-datos/facturas/audio.
Movimientos: /movimientos/documento, /movimientos/foto, /api/carga-datos/movimientos/audio.
Todo el tráfico incluye el encabezado X-Usuario-Sub para asegurar que los datos pertenecen exclusivamente a la organización del usuario activo.




Guía Maestra del Dashboard de Control (/dashboard)
El Dashboard es el centro neurálgico de MyCFO. Proporciona una vista de 360 grados de la salud financiera de tu organización, consolidando datos de facturas, movimientos bancarios y presupuestos en una sola pantalla interactiva.

1. Cabecera y Control de Moneda
Al ingresar, el sistema te recibe con un saludo personalizado y herramientas de filtrado global.

Elementos:
Selector de Moneda (ARS/USD): Ubicado en la parte superior. Permite convertir instantáneamente todos los valores del gráfico y las tarjetas a la moneda preferida.
Saludo Personalizado: "Hola, [Nombre]".
Leyenda: "Todo lo importante de tu cuenta, en un solo lugar".
2. Barra de Acciones Rápidas (Quick Actions)
Es una barra interactiva "sticky" (permanece visible al hacer scroll en desktop) que permite realizar las tareas más frecuentes sin navegar por el menú lateral.

Botones y Funcionalidades:
Cargar movimiento: Acceso directo a /carga para registrar ingresos o egresos manuales.
Icono: AddCircle (+).
Importar Excel: Salto directo a la carga de planillas bancarias (/carga-movimientos).
Icono: UploadFile.
Mercado Pago: Acceso a la integración y visualización de saldos de MP (/mercado-pago).
Icono: AccountBalanceWallet.
Conciliar: Lleva al panel de conciliación para emparejar movimientos con facturas (/conciliacion).
Icono: PublishedWithChanges.
Cargar factura: Acceso directo al formulario específico de comprobantes fiscales (/carga/factura).
Icono: ReceiptLong.
Nuevo presupuesto: Inicia la creación de una nueva planificación financiera (/presupuestos/nuevo).
Icono: Assessment.
Recordatorio: Abre la gestión de notificaciones y alarmas (/recordatorios).
Icono: NotificationsActive.
3. Resumen Financiero (KPI Cards)
Cuatro tarjetas principales que muestran las métricas críticas del mes en curso.

Las 4 Métricas Clave:
Ingresos Totales Mensuales: Suma de todas las entradas de dinero registradas en el mes actual.
Egresos Totales Mensuales: Suma de todos los gastos y salidas del mes.
Resultado Neto Mensual: La diferencia entre Ingresos y Egresos (Tu "ganancia" o "pérdida" operativa del mes).
Dinero Total: Saldo consolidado actual sumando todas tus cajas y cuentas vinculadas.
4. Tendencias e Indicadores Visuales
El Dashboard despliega gráficos avanzados de los últimos 12 meses para entender la estacionalidad de tu negocio.

Bloque de Ingresos:
Gráfico de Tendencia: Muestra la evolución mensual. Incluye indicadores de Promedio, Máximo (el mes con más ventas) y Mínimo.
Ingresos por Categoría: Un desglose visual que permite identificar qué unidad de negocio o tipo de ingreso es el más relevante.
Bloque de Egresos:
Gráfico de Tendencia: Evolución de los gastos en el último año.
Egresos por Categorías: Identifica en qué se está yendo el dinero (ej: Logística, Marketing, RRHH).
5. Widgets Especializados
Debajo de los gráficos, se encuentran tarjetas tácticas con información específica.

A. Presupuestos (BudgetWidget)
Funcionalidad: Compara lo que planeaste gastar vs. lo que realmente gastaste en el período actual.
Visualización: Barras de progreso que se llenan. Si una barra supera el 100%, el presupuesto está excedido.
B. Brecha de Liquidez (LiquidityGapWidget)
Propósito: Analiza el tiempo que transcurre entre tus cobros y tus pagos para alertarte sobre posibles faltas de efectivo.
C. Conciliación Bancaria (ReconciliationWidget)
Métricas: Total de movimientos, cantidad Conciliados y cantidad Pendientes.
Barra de Avance: Porcentaje total de conciliación del mes.
Detalle por Tipo: Desglose de cuántos ingresos y egresos faltan procesar.
Acción: Botón "Ir a conciliación" para resolver los pendientes.
6. Listados Recientes
Al final del tablero, encontrás las últimas operaciones para un control rápido.

Movimientos Recientes: Los últimos 5 registros de caja/bancos.
Facturas Recientes: Los últimos comprobantes de compra/venta cargados.
7. Insights de IA (Solo Administradores)
Un panel exclusivo motorizado por la IA que analiza todos tus datos y genera recomendaciones automáticas como:

"Tus gastos en [Categoría] subieron un 20% respecto al mes pasado".
"Tenés facturas por cobrar que vencen pronto".
Consejos de ahorro u optimización de flujo de caja.
8. Sincronización
En la esquina inferior derecha existe el botón "Recargar datos de Dashboard". Al pulsarlo, el sistema invalida la caché local y vuelve a consultar todos los microservicios para asegurar que estás viendo la información actualizada al segundo.
Guía Maestra de Movimientos Financieros (/ver-movimientos)
La pantalla de Movimientos Financieros es la herramienta de auditoría avanzada de MyCFO. Permite visualizar, filtrar, exportar y gestionar cada registro de dinero (Ingresos, Egresos, Deudas y Acreencias) que haya sido cargado en el sistema.

1. Centro de Control: Filtros y Búsqueda
Ubicado en la parte superior, este bloque permite encontrar cualquier operación entre miles de registros de forma instantánea.

Funcionalidades de Filtrado:
Barra de Búsqueda Inteligente:
Podés escribir texto (descripción, categorías) o una fecha específica en formato DD/MM/YYYY.
El sistema detecta automáticamente si estás buscando una fecha y ajusta la consulta al backend.
Rango de Fechas (Desde/Hasta):
Calendarios para acotar la búsqueda a un período contable específico.
Botón "Limpiar": Restablece todos los filtros de fecha y monto.
Selector de Rango de Montos:
Un menú desplegable que se calcula dinámicamente según el movimiento más grande que tengas.
Ejemplo: "0 - 50.000", "50.000 - 100.000", etc.
Cambio de Moneda:
Los tabs de ARS / USD cambian el contexto de toda la tabla. Al cambiar, los montos se actualizan y el filtro de rango se recalcula para la moneda elegida.
2. La Tabla de Datos (Smart DataGrid)
MyCFO utiliza una tabla de alto rendimiento con paginación del servidor. Esto significa que solo descarga los datos que estás viendo (10, 25 o 50 filas), permitiendo una navegación fluida incluso con años de historia.

Columnas y su Significado:
Tipo: Indica la naturaleza del registro (Ingreso, Egreso, Deuda, Acreencia). Cada uno tiene un color y un icono distintivo.
Monto:
Los Egresos se muestran con signo negativo (-) y color rojo.
Los Ingresos se muestran en verde.
Incluye el código de moneda (ej: ARS).
Fecha: Fecha de emisión o registro del movimiento.
Estado (Oculto por defecto en PC): Indica si la operación está "Cobrada", "Pagada", "Pendiente" o "Vencida".
Categoría: Clasificación del movimiento (ej: Ventas, Logística).
Origen / Destino: Los nombres de las partes involucradas (clientes, proveedores o cuentas propias).
Descripción: Notas aclaratorias del movimiento.
3. Acciones de Gestión (Auditoría)
En la última columna de cada fila, encontrás los botones de control:

Ver Detalle (Icono Ojo):
Abre una tarjeta de información completa.
Muestra datos técnicos como CUITs, ID de transacción, medio de pago y detalles de auditoría que no caben en la tabla.
Editar (Icono Lápiz):
Permite corregir montos, fechas o categorías.
Regla de integridad: Por seguridad, el sistema no permite cambiar el "Tipo" de un movimiento ya creado (ej: no podés transformar un Egreso en un Ingreso por error; deberías borrarlo y crearlo de nuevo).
Eliminar (Icono Tacho):
Abre un diálogo de confirmación con el resumen de lo que vas a borrar para evitar accidentes.
4. Exportación de Reportes
Al costado derecho, el botón "Exportar" ofrece dos opciones profesionales:

Excel (.xlsx):
Genera una planilla de cálculo con todos los movimientos filtrados.
La planilla tiene diseño "Zebra" (filas de distinto color) y paneles inmovilizados para facilitar la lectura en Excel.
PDF (.pdf):
Genera un reporte formal con carátula.
Incluye KPIs de resumen (cantidad de registros, fechas cubiertas) y el logo de tu organización.
Notificación: Al finalizar cualquier exportación, recibirás un aviso en el sistema confirmando que el reporte fue generado con éxito.
5. Visualización Mobile
En dispositivos móviles, la tabla se simplifica automáticamente para priorizar la legibilidad:

Solo se muestran las columnas de Monto y Acciones.
Al tocar en "Ver Detalle" (Ojo), se accede a toda la información que está oculta en la versión reducida.
Guía Maestra de Facturas Cargadas (/ver-facturas)
La pantalla de Facturas Cargadas es el repositorio central de todos los comprobantes fiscales procesados por MyCFO. Permite gestionar legal y financieramente tus facturas de compra y venta con herramientas de precisión contable.

1. Herramientas de Búsqueda y Filtrado
Ubicadas en la cabecera, estas herramientas permiten segmentar grandes volúmenes de facturación rápidamente.

Parámetros de Filtrado:
Buscador Global:
Podés ingresar el Número de Factura, nombre del Vendedor/Comprador o una Fecha (DD/MM/YYYY).
El buscador es inteligente: si escribís una fecha válida, el sistema prioriza la búsqueda por ese día exacto.
Rango de Fechas (Desde/Hasta):
Filtra comprobantes por su fecha de emisión oficial.
Útil para cierres mensuales o trimestrales.
Selector de Rango de Montos:
Al igual que en movimientos, este menú se autogenera basándose en la factura de mayor valor que tengas registrada.
Ejemplo: "10.000 - 50.000 ARS".
Contexto de Moneda:
Los botones ARS / USD aplican un filtro global. Solo verás las facturas emitidas en la moneda seleccionada, facilitando el análisis de cuentas bimonetarias.
2. El Listado de Comprobantes (DataGrid)
La tabla presenta la información técnica de cada factura con un diseño optimizado para contadores y administradores.

Información de Columnas:
Número: El identificador legal del documento (ej: 0001-00004321).
Tipo: Se muestra mediante etiquetas de colores (A, B, C, M, etc.), siguiendo la normativa fiscal vigente.
Fecha Emisión: La fecha oficial del comprobante.
Monto: El valor total de la factura.
Moneda: Código de la divisa (ARS, USD, EUR).
Estado de Pago: Indica si el documento ya fue cancelado o si sigue pendiente de pago/cobro.
3. Acciones de Auditoría y Control
MyCFO permite un control total sobre cada documento registrado:

Detalle de Factura (Ojo):
Abre la vista completa del documento.
Aquí podés ver datos extendidos: CUIT del emisor y receptor, categorías de IVA, conceptos detallados y cualquier observación adicional.
Edición (Lápiz):
Permite corregir errores de carga manual u optimizar los datos extraídos por IA.
Podés modificar números, fechas, montos y descripciones.
Eliminación (Tacho):
Elimina el registro del sistema tras una doble confirmación.
4. Exportación de Datos Contables
El botón "Exportar" permite sacar la información fuera de MyCFO para tu contador o sistema de gestión externo.

Excel (.xlsx): Exporta el listado completo con filtros aplicados. Las columnas están preparadas para ser importadas en otros sistemas o para realizar conciliaciones manuales.
PDF (.pdf): Genera un informe profesional con carátula de la organización, ideal para presentaciones de balance o estados de cuenta ante terceros.
Notificación de Éxito: El sistema te avisa mediante una notificación push/banner cuando el archivo está listo para su descarga.
5. Experiencia en Celulares (Mobile)
Para facilitar la consulta rápida en la calle o en reuniones:

La tabla se contrae y solo muestra el Número de Factura y las Acciones.
Desde el botón de "Detalle", podés abrir la ficha completa para verificar CUITs o montos sin necesidad de una computadora.
Guía Maestra de Conciliación Bancaria (/conciliacion)
La Conciliación es el proceso mediante el cual se "empatan" los movimientos reales de dinero (entradas y salidas de banco/caja) con los documentos que los justifican (facturas, deudas, acreencias). Es la clave para tener una contabilidad impecable y asegurar que cada centavo esté justificado.

1. Panel de Estadísticas (KPIs de Control)
En la parte superior, MyCFO presenta un resumen en tiempo real del estado de tu conciliación:

Total de Movimientos: La cantidad de transacciones registradas en el período.
Sin Conciliar: El número de operaciones que aún no tienen un documento asociado (pendientes de auditoría).
Conciliados: Operaciones que ya fueron justificadas correctamente.
Barra de Progreso: Un indicador visual que muestra qué tan cerca estás de completar la conciliación del mes. El objetivo es llegar siempre al 100%.
2. El Panel de Trabajo Dual
La pantalla está dividida en dos columnas principales diseñadas para trabajar en paralelo:

A. Columna Izquierda: Movimientos Bancarios
Aquí ves el listado de tus transacciones.
Cada tarjeta muestra: Fecha, Descripción (del extracto), Importe y el Origen (ej: Banco Galicia, Caja Efectivo).
Estados Visuales:
Reloj (Naranja): Pendiente de conciliación.
Check (Verde): Ya conciliado con éxito.
B. Columna Derecha: Sugerencias Inteligentes
Al tocar un movimiento de la izquierda, MyCFO activa su motor de búsqueda inteligente.
El sistema busca automáticamente facturas o deudas que coincidan en monto y fecha cercana.
Estas sugerencias aparecen como tarjetas con un botón "Vincular".
3. Flujo de Operación
Cómo conciliar un movimiento:
Selección: Toca un movimiento con estado "Pendiente" en la columna izquierda.
Revisión: Mirá las sugerencias del panel derecho. El sistema te mostrará los documentos más probables de ser la causa de ese movimiento.
Vinculación: Si la factura coincide, presioná "Vincular". El movimiento se marcará automáticamente en verde y se descontará del contador de pendientes.
Cómo desvincular (Corregir errores):
Si te equivocaste al asociar un documento, simplemente seleccioná el movimiento conciliado y presioná el botón "Desvincular". La factura volverá a estar disponible y el movimiento volverá a estado pendiente.
4. Filtros Avanzados y Búsqueda
Para facilitar la tarea en meses con mucha actividad, podés usar:

Filtro de Estado: Seleccioná para ver solo los "Sin Conciliar", los "Conciliados" o "Todos".
Filtro de Tipo: Segmentá por solo Ingresos o solo Egresos.
Buscador de Texto: Escribí palabras clave (ej: "Sueldos", "Luz") o montos exactos para encontrar movimientos específicos.
Selector de Moneda: Cambiá entre ARS y USD para conciliar cuentas en distintas divisas.
5. Experiencia Mobile
En celulares, MyCFO adapta el flujo para que sea manejable con una sola mano:

La pantalla muestra los movimientos uno por uno.
Al seleccionar uno, el panel de sugerencias se despliega debajo.
Las estadísticas se simplifican en una vista compacta para ahorrar espacio.
6. Seguridad y Permisos
Solo Escritura: Si bien todos los usuarios con permiso pueden "ver" la conciliación, solo los administradores o usuarios con rol de "Editor" pueden realizar la acción de Vincular o Desvincular.
Si no tenés permisos suficientes, los botones de acción estarán deshabilitados.
Guía Maestra de Carga de Movimientos (Excel/Bancos) (/carga-movimientos)
El módulo de Carga de Movimientos permite importar cientos de registros financieros en segundos. Está diseñado para procesar extractos bancarios, planillas de Mercado Pago o archivos Excel propios, eliminando la necesidad de carga manual.

1. Selección de Plantilla (Tipo de Archivo)
Antes de subir un archivo, debés indicarle al sistema qué formato tiene. MyCFO ofrece tres grandes grupos de procesamiento:

A. Plantillas de Bancos e Instituciones
Banco Galicia, Santander, Nación, BBVA: Formatos pre-configurados para que solo tengas que bajar el Excel de tu Home Banking y subirlo sin cambios.
Mercado Pago: Especialmente optimizado para el reporte de movimientos de la plataforma.
Ualá (PDF): Procesamiento de resúmenes en formato PDF.
B. Plantilla Genérica MyCFO
Se recomienda cuando querés pasar datos de otro sistema a MyCFO. Se basa en una estructura fija de columnas: Fecha, Descripción, Monto, Categoría, etc.
C. Excel Libre (Mapeo Manual)
Es la herramienta más potente de MyCFO. Te permite subir CUALQUIER Excel o CSV, indicándole al sistema dónde están los datos:

Mapeo de Columnas: Podés decir que la Fecha está en la columna A (0), la Descripción en la B (1) y el Monto en la C (2).
Configuración de Formato: Podés definir desde qué fila empiezan los datos (para ignorar encabezados), el formato de la fecha (ej: dd/mm/aaaa) y el separador decimal (coma o punto).
2. El Proceso de Carga (Paso a Paso)
El sistema utiliza un flujo de seguridad con vista previa para asegurar que no se carguen datos erróneos.

Arranque: Seleccionás el Tipo de archivo y cargás el Excel en la zona de Dropzone (podés arrastrar el archivo o hacer clic para buscarlo).
Vista Previa: Al pulsar "Vista Previa", el sistema procesa el archivo pero AÚN NO GUARDA NADA. Se abre una ventana donde verás los datos detectados.
Selección Manual: En la vista previa, podés marcar o desmarcar filas. Esto es útil para ignorar movimientos que no querés registrar (ej: transferencias entre cuentas propias que ya tenés cargadas).
Importación Final: Una vez revisado, pulsás "Importar Seleccionados".
3. Resultado y Gestión de Errores
Al finalizar la carga, el sistema muestra un Resumen de Carga:

Registros Exitosos: Cantidad de movimientos que se grabaron correctamente.
Registros Fallidos: Cantidad de filas que el sistema no pudo procesar.
Tabla de Errores: Si hubo fallos, verás una tabla detallada indicando en qué número de fila estuvo el problema (ej: "Fecha inválida en fila 42" o "Monto no numérico").
4. Historial de Cargas
La pestaña "Historial de Cargas" permite auditar el pasado:

Podés ver listadas todas las importaciones masivas realizadas.
Muestra el Usuario que hizo la carga, el Nombre del archivo, el Banco/Origen y la Fecha/Hora exacta.
Esto garantiza la trazabilidad total: ante cualquier duda sobre un saldo, podés ver de qué Excel provino el dato.
5. Tips de Uso Pro
Limpieza de Excel: Antes de subir, asegurate de que el archivo no tenga filas totalmente vacías o imágenes, ya que pueden confundir al motor de importación.
Paginación en Vista Previa: Si el archivo es muy grande, la vista previa te permitirá navegar por páginas para revisar los datos con comodidad.
Formatos Soportados: El sistema acepta archivos .xls, .xlsx y .csv.
Guía Maestra de Integración con Mercado Pago (/mercado-pago)
El módulo de Mercado Pago permite conectar tu cuenta de MP directamente con MyCFO. Con esta integración, podés importar tus ventas y cobros de forma automatizada, clasificarlos en categorías y hasta generar facturas masivas, manteniendo tu flujo de caja siempre actualizado.

1. Vinculación de Cuenta
Para comenzar, debés autorizar a MyCFO para leer tus movimientos de Mercado Pago.

Estado No Vinculado: Verás un botón de "Vincular cuenta de Mercado Pago". Al pulsarlo, serás redirigido al sitio oficial de Mercado Pago para autorizar el acceso.
Seguridad: MyCFO solo solicita permisos de lectura y gestión de pagos para poder sincronizarlos. Tus credenciales son manejadas de forma segura y nunca son almacenadas directamente por nosotros.
Confirmación: Una vez completado el proceso, volverás a MyCFO y verás el nombre de tu cuenta y el email asociado en el encabezado.
2. Motor de Importación de Pagos
MyCFO no trae todos tus pagos antiguos de golpe para no saturar tu base de datos; vos elegís qué y cuándo importar.

Opciones de Importación:
Por Período (Mes/Año): Seleccioná un mes específico y el sistema buscará todas las transacciones de ese tiempo.
Por ID de Pago: Si necesitás registrar un cobro puntual muy específico, podés ingresar su ID de Mercado Pago.
Flujo de Vista Previa (Obligatorio):
Antes de importar, el sistema te muestra una lista de lo que encontró en Mercado Pago.
Podés marcar o desmarcar pagos individualmente.
El sistema te avisa si un pago ya existe en MyCFO para evitar duplicados.
3. Gestión y Categorización de Cobros
Una vez importados, los pagos aparecen en la tabla principal de Mercado Pago.

Acciones Disponibles:
Asignación de Categoría: Podés tocar la categoría de cualquier pago y cambiarla (ej: de "Ventas" a "Servicios"). Esto impactará directamente en tus reportes de resultados.
Facturación Masiva: Seleccioná uno o varios pagos y usá el botón "Facturar Seleccionados". MyCFO iniciará el proceso de generación de comprobantes para esos cobros (sujeto a configuración impositiva).
Detalle Técnico: La tabla muestra el ID de pago, el detalle del producto/servicio, el nombre del comprador, el importe neto cargado y el estado (approved, in_process, etc.).
4. Auditoría y Exportación
Exportar a Excel: El botón de descarga genera un archivo .xls compatible con Excel con toda la información de la tabla, ideal para conciliaciones externas o backups personales.
Filtros de Búsqueda: Podés filtrar los pagos importados por:
Texto: Nombre del cliente o ID de pago.
Fechas: Rango Desde / Hasta.
Estado de Pago: Solo aprobados, rechazados, etc.
Desvinculación: Si necesitás cambiar de cuenta o simplemente dejar de usar la integración, podés usar el botón "Desvincular" en la configuración. Esto no borrará los pagos ya importados, pero detendrá la comunicación con Mercado Pago.
5. Tips de Sincronización
Refresco Manual: Si realizaste una venta hace instantes y no la ves, usá el botón de "Recargar".
Categoría por Defecto: Podés configurar una categoría automática para que todos los pagos importados de Mercado Pago se clasifiquen solos al entrar al sistema.
Polling Inteligente: Tras una importación masiva, el sistema realizará breves consultas automáticas para asegurarse de que todos los datos se hayan procesado correctamente antes de que cierres la pantalla.
Guía Maestra de Reporte Mensual (/reporte-mensual)
El Reporte Mensual es la herramienta de análisis de cierre de MyCFO. Permite visualizar de forma consolidada cómo se comportaron tus finanzas durante un mes específico, agrupando cada movimiento por su categoría para entender exactamente en qué se gasta y de dónde proviene el dinero.

1. Filtros y Periodo de Análisis
En la parte superior, podés configurar el alcance del reporte:

Mes y Año: Seleccioná el período que deseás auditar. El sistema recargará automáticamente los datos del servidor para ese mes.
Selector de Categorías: Permite filtrar el reporte para ver solo categorías específicas (ej: solo "Ventas" y "Sueldos"), ideal para análisis granulares sin ruido de otras transacciones.
Soporte Multimoneda: Mediante las pestañas ARS / USD, podés alternar la divisa del reporte. El sistema consolidará solo los movimientos de la moneda elegida.
2. Indicadores y Tablas de Resumen
El reporte presenta una estructura clara para comparar el rendimiento:

Tabla de Detalle: Muestra dos columnas principales (Ingresos y Egresos) con sus respectivos totales por categoría.
Cálculo Neto: El sistema calcula automáticamente la diferencia entre lo que entró y lo que salió, dándote el resultado operativo del mes.
Interactividad: Al navegar por las categorías, verás los montos exactos formateados según la moneda local seleccionada.
3. Análisis Visual (Gráficos)
Para una comprensión rápida de la distribución del dinero, MyCFO incluye gráficos de torta dinámicos:

Desglose de Ingresos: Muestra qué porcentaje de tus entradas representa cada categoría (ej: 80% Ventas, 20% Inversiones).
Desglose de Egresos: Identifica visualmente tus mayores centros de costo (ej: Alquiler, Impuestos, Proveedores).
Tooltips: Al pasar el mouse (o tocar en mobile) sobre una porción del gráfico, verás el monto exacto y el nombre de la categoría.
4. Exportación Profesional
MyCFO permite transformar este análisis en documentos listos para compartir o archivar:

A. Exportar a Excel (.xlsx)
Genera una planilla organizada con:

Encabezados claros del periodo.
Tablas de ingresos y egresos con formato numérico contable.
Celdas con colores para diferenciar subtotales y totales.
Panel administrativo congelado para facilitar la lectura de listas largas.
B. Exportar a PDF (Informe de Gestión)
Crea un documento profesional con:

Carátula Automática: Incluye el logo de la organización, el periodo y KPIs clave (Total Ingresos, Total Egresos, Neto).
Gráficos Integrados: Incluye los diagramas de torta tal como se ven en pantalla.
Tablas de Rendimiento: Un anexo detallado con todos los números del mes.
5. Experiencia Mobile y Smart Context
Diseño Adaptativo: En celulares, los gráficos se apilan verticalmente para una visualización cómoda y las tablas permiten scroll lateral si es necesario.
Integración con IA: El reporte está conectado al Chatbot de MyCFO. Si tenés dudas sobre un número, podés preguntarle: "¿Por qué subieron los egresos de este mes respecto al anterior?" y la IA usará el contexto del reporte actual para responderte.
Guía Maestra de Flujo de Caja (/flujo-de-caja)
El Flujo de Caja (o Cash Flow) es la herramienta vital de tesorería en MyCFO. A diferencia del Reporte Mensual que se enfoca en un solo periodo, el Flujo de Caja te permite ver la evolución de tu liquidez a lo largo de todo el año, detectando meses de superávit o posibles faltantes de dinero antes de que ocurran.

1. El Concepto de Liquidez Anual
MyCFO organiza todos tus movimientos financieros en una vista cronológica (Enero a Diciembre) para calcular dos métricas críticas:

Net Cash Flow (Flujo Neto): Es la diferencia de "dinero que entró" menos "dinero que salió" en cada mes exacto. Si el número es positivo, generaste caja; si es negativo, consumiste más de lo que ingresó.
Cash on Hand (Efectivo disponible): Es el saldo acumulado. Toma el dinero que tenías al inicio y le suma/resta el flujo de cada mes para decirte exactamente cuánto dinero tenés en total al final de cada periodo.
2. La Tabla Detallada (Estructura de Tesorería)
La tabla de Cash Flow es la pieza central del análisis y sigue el formato contable estándar:

Cash on Hand (Inicio): Saldo disponible al empezar el mes.
Ingresos: Desglose por categorías (Ventas, Inversiones, Cobros, etc.) mes a mes.
Egresos: Desglose por categorías (Luz, Alquiler, Sueldos, Impuestos, etc.) mes a mes.
Resumen de Flujo: Total de Ingresos del mes vs Total de Egresos.
Cierre: Net Cash Flow y Cash on Hand (Fin).
3. Comparativo Visual (Gráficos)
Para una lectura rápida de la salud financiera, MyCFO presenta un Gráfico de Barras Comparativo:

Barra Verde (Ingresos): La altura indica el volumen de ventas o cobros de ese mes.
Barra Roja (Egresos): Indica el nivel de gasto o salida de dinero.
Análisis de Tendencia: Permite identificar estacionalidad (ej: meses donde siempre se gasta más o meses donde las ventas suelen subir).
4. Exportación y Reportes de Auditoría
Al igual que otros módulos de reportes, el Flujo de Caja permite generar documentación oficial:

Excel (.xlsx): Exporta una planilla de cálculo profesional. Las fórmulas están optimizadas para que puedas seguir trabajando el flujo de caja de forma externa si lo necesitás. Incluye el formato bimonetario (ARS/USD) según tu selección.
PDF (Reporte de Tesorería): Genera un documento PDF con carátula, KPIs anuales y el gráfico comparativo para presentar ante socios o entidades bancarias.
5. Mobile: Ventana Inteligente
Dado que una tabla de 12 meses es muy ancha para un celular, MyCFO implementa una ventana móvil de 3 meses:

En lugar de ver todo el año, ves el mes actual y sus dos meses adyacentes.
Podés "deslizar" o seleccionar el mes en la tabla para que el gráfico y los datos se actualicen automáticamente, manteniendo la claridad visual sin saturar la pantalla.
6. Filtros y Moneda
Selector de Año: Podés navegar hacia atrás para consultar el flujo de caja de años anteriores.
Currency Tabs (Soporte Bimonetario): Fundamental para empresas que operan en dólares y pesos. Podés ver tu flujo de caja totalmente en ARS o totalmente en USD con un solo clic.
Smart Context: El Chatbot sabe qué meses de tu flujo de caja fueron críticos. Probá preguntarle: "¿Cuál fue el mes con mayor salida de dinero y en qué se gastó?".
Guía Maestra de Estado de Resultados (P&L) (/estado-de-resultado)
El Estado de Resultados (también conocido como P&L o Pérdidas y Ganancias) es el informe económico definitivo de MyCFO. A diferencia del Flujo de Caja que mide el "movimiento de dinero", el Estado de Resultados mide la rentabilidad real de tu negocio, permitiéndote saber si estás ganando o perdiendo dinero tras considerar todos tus ingresos y costos operativos.

1. Análisis de Rentabilidad Anual
El sistema consolida toda la actividad del año fiscal seleccionado para presentarte un resumen de performance económica:

Resultado del Ejercicio: Es la cifra final que indica la ganancia o pérdida neta del periodo. Se calcula restando todos tus Egresos de todos tus Ingresos.
Consolidación por Categoría: Agrupa los movimientos por su naturaleza operativa (ej: Ventas, Costo de Mercaderías, Gastos Administrativos, Impuestos), permitiéndote identificar qué áreas impactan más en tu utilidad final.
2. Comparativo Mensual (Eficiencia Operativa)
MyCFO incluye un Gráfico de Barras Anual que permite auditar la consistencia de tu negocio mes a mes:

Ingresos vs Egresos: Verás dos barras por mes. La relación entre ellas indica tu margen operativo.
Detección de Estacionalidad: Podés identificar rápidamente si hay meses donde tus costos suben desproporcionadamente respecto a tus ventas.
Interacción: Al pasar el mouse por las barras, el sistema te muestra los montos exactos formateados en la moneda elegida.
3. Estructura del Informe (Tabla de Detalle)
La tabla de Estado de Resultados sigue una jerarquía clara para facilitar la lectura contable:

Bloque de Ingresos: Suma total de entradas por ventas, servicios u otros ingresos operativos.
Bloque de Egresos: Detalle de todos los costos (Variables, Fijos, Impuestos).
Neto Final: La utilidad o pérdida neta resultante, destacada visualmente para un control rápido.
4. Exportación y Reportes de Gestión
Este módulo está preparado para generar reportes que podés presentar ante directorios, socios o contadores:

Excel Profesional (.xlsx): Exporta una sábana de datos con formato contable, celdas de totalización automáticas y un diseño limpio para auditoría manual.
PDF de Alta Gerencia: Genera un documento con carátula, logo de la empresa, KPIs destacados (Ingresos Totales, Egresos Totales, Resultado Final) y el gráfico comparativo mensual. Es el documento ideal para cierres de año o reuniones de balance.
5. Soporte Bimonetario (ARS/USD)
Análisis en Divisas: Mediante los tabs superiores, podés cambiar la visualización completa entre Pesos y Dólares.
Precisión: El sistema utiliza los tipos de cambio registrados y la moneda original de cada movimiento para ofrecerte una visión fiel de tu rentabilidad en la moneda que prefieras para tus reportes de gestión.
6. Smart Context: La IA a tu servicio
El Estado de Resultados está totalmente integrado con el Chatbot de MyCFO. Gracias al contexto compartido:

Podés preguntar: "¿Cuál es mi margen de ganancia este año?".
O pedir comparaciones complejas: "¿Cómo varió el peso de mis egresos administrativos sobre el total de ventas respecto al año pasado?".
La IA analizará los datos que estás viendo en pantalla para darte una respuesta estratégica.
Guía Maestra de Presupuestos (/presupuestos)
El módulo de Presupuestos de MyCFO es la herramienta definitiva para la planificación estratégica de tu negocio. Permite proyectar ingresos y gastos, monitorear el cumplimiento en tiempo real y realizar ajustes granulares mes a mes.

1. Centro de Gestión de Presupuestos (/presupuestos)
Esta es la pantalla principal donde visualizás todos tus planes financieros.

Características de la Lista:
Filtrado Bimonetario: Usá los selectores de moneda para ver solo los presupuestos en ARS o USD.
Estados (Activos / Eliminados): MyCFO cuenta con una Papelera de Reciclaje. Si eliminás un presupuesto por error, tenés hasta 90 días para restaurarlo desde la pestaña "Eliminados".
Búsqueda Avanzada: Podés buscar presupuestos por nombre o por rangos de fechas específicos.
Acciones Rápidas: Desde la lista podés saltar directamente al detalle anual o gestionar la eliminación/restauración.
2. Creación de un Nuevo Presupuesto (/presupuestos/nuevo)
El sistema utiliza un Asistente (Wizard) de 3 pasos diseñado para automatizar la carga de datos.

Reglas de Cálculo Inteligente (Paso 2):
Para ahorrar tiempo, podés definir cómo se comporta cada categoría:

Fijo Mensual: Ideal para alquileres o abonos: el monto se repite igual todos los meses.
Ajuste % Mensual: Perfecto para proyectar inflación o crecimiento de ventas (ej: aumentar 5% cada mes).
Único (1 mes): Para gastos o ingresos puntuales (ej: el pago de un aguinaldo o un bono).
En Cuotas: Permite cargar un monto total (ej: una inversión de $1.2M) y dividirla en N cuotas, con opción de aplicar Interés Mensual (Sistema Francés).
TIP

Bloquear Negativos: Al activar este switch en el paso 2, el sistema impedirá cargar montos menores a cero, evitando errores comunes de signo.

3. Tablero de Control Anual (/presupuestos/:nombre)
Al entrar en un presupuesto, accedés a una "foto" completa del año:

Semáforo de Salud: MyCFO califica la ejecución presupuestaria en Verde (excelente), Amarillo (atención) o Rojo (desvío crítico) basándose en el porcentaje de cumplimiento real vs. estimado.
KPIs de Desvío: Verás el acumulado de Ingresos, Egresos y Resultado Neto, comparando lo que planeaste con lo que realmente sucedió en tus cuentas.
Gráficos de Comparación: Visualización de barras para comparar el cumplimiento mes a mes.
Navegación Profunda: Hacé clic en cualquier fila del mes para entrar al Detalle Operativo.
4. Detalle de Ejecución Mensual (/presupuestos/:nombre/detalle/:mes)
Aquí es donde gestionás los números finos del mes actual o pasado (ej: /presupuestos/plan-2025/detalle/enero).

Sincronización Automática
Monto Real: MyCFO busca automáticamente todos los movimientos registrados en ese mes y categoría para mostrarte el gasto/ingreso real sin que cargues nada extra.
Auditoría Directa: Si un número real no te cuadra, el botón de "Edición en movimientos" te lleva directamente a la pantalla de Ver Movimientos filtrada por ese mes y categoría específica para que audites la fuente.
Edición Protegida (Guards)
Por seguridad, los datos de un presupuesto guardado están "bloqueados". Para modificarlos:

Deberás hacer clic en el candado/icono de edición.
Confirmar en el diálogo de seguridad que entendés que cambiar el presupuesto afecta tus proyecciones.
Solo entonces podrás sobrescribir el estimado o cambiar el tipo de categoría.
5. Reportes y Consultas con IA
Exportación Profesional: Descargá el detalle mensual o anual en Excel (para análisis de datos) o PDF (con gráficos y carátula ejecutiva para presentaciones).
Asistente IA: El chatbot conoce el estado de tu presupuesto. Preguntale:
"¿Cuál fue mi mayor desvío en los egresos de marzo?"
"¿Cuánto me queda de presupuesto para Marketing este año?"
"Compará el cumplimiento del presupuesto actual contra el del año pasado."
Guía Maestra de Pronóstico Continuo (/pronostico-continuo)
El Pronóstico Continuo (Rolling Forecast) es la herramienta de inteligencia predictiva más dinámica de MyCFO. A diferencia de un presupuesto estático, el pronóstico continuo evoluciona con tu negocio, utilizando cada nuevo movimiento cargado para refinar las proyecciones del futuro.

1. Concepto: Rolling Forecast
El sistema utiliza un algoritmo que analiza tus Ingresos, Egresos y Balance Neto históricos para proyectar una tendencia hacia adelante.

Siempre Actualizado: No requiere que cargues planes manualmente. Se alimenta de la realidad de tus cuentas.
Dinámico: Si este mes tus ventas suben inesperadamente, el pronóstico ajustará automáticamente la tendencia de los meses siguientes.
2. Configuración de la Proyección
Al ingresar al módulo, podés configurar los parámetros de generación:

Horizonte de Tiempo
Elegí qué tan lejos en el futuro querés mirar. Las opciones disponibles son:

1 año (12 meses)
2 años (24 meses)
3 años (36 meses)
4 años (48 meses)
5 años (60 meses)
Gestión Bimonetaria
El pronóstico puede generarse tanto en Pesos (ARS) como en Dólares (USD).

IMPORTANT

Al cambiar la moneda, el sistema limpia la proyección anterior y requiere presionar nuevamente "Generar Forecast" para recalcular los datos con los tipos de cambio actuales.

3. Análisis Visual del Gráfico
El corazón del módulo es un gráfico de líneas profesional diseñado para la toma de decisiones rápidas.

Zona Real vs. Zona Estimada
El gráfico se divide visualmente mediante dos elementos clave:

Línea de Referencia: Una línea vertical punteada marca el punto exacto donde terminan los datos históricos (Real) y comienzan las proyecciones (Estimado).
Área Sombreada: Toda la zona a la derecha de la línea de referencia cuenta con un fondo azul suave, indicando que esos datos son proyecciones matemáticas.
Modos de Visualización
Podés filtrar qué curvas ver en el gráfico para evitar el ruido visual:

Todos: La vista completa con Ingresos, Egresos y Balance.
Solo Ingresos: Foco en el crecimiento proyectado de las ventas.
Solo Egresos: Monitoreo de la tendencia de gastos operativos.
Solo Balance: La métrica más crítica de salud financiera a largo plazo.
4. Interacción con la IA
El Chatbot de MyCFO está integrado profundamente con esta pantalla. Gracias al contexto enviado, podés pedirle análisis complejos:

"¿En qué año se proyecta que mis egresos superen a mis ingresos según la tendencia actual?"
"Basado en el pronóstico de 3 años, ¿cuál será mi balance neto proyectado para diciembre de 2026?"
"Explicame por qué la curva de ingresos muestra una tendencia alcista en los últimos meses del horizonte."
5. Casos de Uso Estratégico
Planificación de Inversiones: ¿Podré comprar maquinaria dentro de 2 años manteniendo un balance positivo?
Detección Previa de Crisis: Si la curva de balance proyectada tiende a cero en 18 meses, es momento de ajustar gastos hoy.
Evaluación de Crecimiento: Verificá si tu ritmo de ingresos crece más rápido que tu ritmo de gastos a lo largo del tiempo.
Guía Maestra de Pronóstico Fijo (/pronostico-fijo)
El sistema de Pronóstico Fijo permite crear "escenarios" o simulaciones financieras basadas en reglas configurables. A diferencia del pronóstico continuo, aquí vos tenés el control sobre qué parámetros usar y cuándo disparar el cálculo, guardando los resultados para consultarlos en el futuro como "fotos" estáticas del negocio.

1. Estructura del Módulo
El módulo se organiza en dos niveles:

Configuraciones: Las "plantillas" o reglas de negocio que definen cómo calcular el futuro.
Pronósticos Generados: Los resultados históricos de aplicar esas reglas en un momento dado.
2. Gestión de Configuraciones
Antes de generar un pronóstico, debés definir una Configuración. Podés tener múltiples (ej: "Escenario Optimista", "Presupuesto Base 2025", "Plan Trimestral").

Parámetros Clave:
Nombre: Identificador del escenario.
Frecuencia: Define los intervalos de tiempo analizados:
Mensual: Análisis estándar mes a mes.
Bimestral: Agrupa datos cada 2 meses.
Semestral: Visión macro de mitad de año.
Anual: Proyección de cierre de ejercicio.
Horizonte: Qué tan adelante querés proyectar (de 1 a 5 años).
3. Generación de Escenarios (Cálculo)
Una vez creada la configuración, podés disparar el cálculo haciendo clic en el botón "Play" (Calcular ahora).

El proceso de cálculo:
Persistencia de Moneda: El pronóstico se calcula en la moneda que tengas seleccionada en ese momento (ARS o USD). Una vez generado, ese pronóstico queda "anclado" a esa moneda para siempre.
Snapshot Histórico: El resultado se guarda con la fecha de generación. Esto permite comparar, por ejemplo, qué proyectabas para 2026 cuando estabas en enero, versus qué proyectás ahora que estás en junio.
4. Visualización y Detalle de Pronóstico
Al abrir un pronóstico generado (icono de Ver), accedés a la interfaz de análisis gráfico.

Interfaz del Gráfico:
Tooltips dinámicos: Al pasar el ratón verás los montos de Ingresos, Egresos y Balance de cada período.
Línea de Corte: El gráfico marca con una línea punteada y un área sombreada azul exactamente dónde empieza la proyección (Estimado) y dónde terminan los datos reales (Real).
Modos de Vista: Seleccioná si querés ver todas las curvas o enfocarte solo en una (Ingresos, Egresos o Balance neto).
Información Técnica del Escenario:
En el panel superior del detalle, MyCFO muestra la "ficha técnica" del cálculo:

Fecha exacta de generación.
Períodos analizados para generar la tendencia.
Horizonte y frecuencia aplicados.
Rango de fechas cubierto por el pronóstico.
5. Accesibilidad en Móviles
En dispositivos móviles, la tabla de pronósticos cuenta con un botón de Información (i) que abre un diálogo optimizado con todos los detalles técnicos del escenario, permitiendo una revisión rápida sin perder el contexto de la lista.

6. IA Predictiva y Escenarios
El Chatbot de MyCFO puede "leer" tus pronósticos fijos. Al estar en la pantalla de detalle de un pronóstico, podés preguntarle:

"¿Este escenario proyecta un crecimiento mayor al del año pasado?"
"¿En qué mes tengo el mayor riesgo de quedarme sin flujo de caja según este pronóstico?"
"Compará este pronóstico (ID: 15) contra el pronóstico continuo actual."
Guía Maestra de Notificaciones (/listado-notificaciones)
El sistema de Notificaciones de MyCFO es el motor de comunicación que te mantiene al tanto de cada evento importante en tu salud financiera. Funciona como un centro de control reactivo que te avisa sobre movimientos inusuales, desvíos presupuestarios y recordatorios críticos.

1. El Centro de Notificaciones (/listado-notificaciones)
Esta pantalla centraliza toda tu historia de alertas en un formato de cuadrícula profesional.

Organización y Visualización:
Tarjetas Inteligenes (NotificationCard): Cada notificación muestra un título descriptivo, el cuerpo del mensaje, la fecha y un Badge que identifica el tipo de alerta (ej: "Movimiento", "Presupuesto", "Recordatorio").
Estados de Lectura: Las notificaciones no leídas resaltan con opacidad total y tipografía clara. Al hacer clic, se marcan como leídas automáticamente, reduciendo su intensidad visual para que te enfoques en lo pendiente.
Contador en Tiempo Real: El encabezado indica exactamente cuántas notificaciones tenés sin leer.
2. Tipos de Alertas Soportadas
MyCFO monitoriza más de 40 eventos distintos para proteger tu negocio:

💰 Movimientos Financieros
Nuevos Movimientos: Alerta inmediata al detectar actividad en tus cuentas.
Montos Altos: Notificaciones especiales para transacciones que superan tus umbrales de seguridad.
Duplicados: El sistema te avisa si detecta dos movimientos idénticos para evitar errores de carga.
Importaciones: Confirmación de carga exitosa de archivos Excel o CSV.
📊 Presupuestos y Pronósticos
Excesos Críticos: Alerta roja cuando superás el 100% de una categoría.
Advertencias Previas: Aviso preventivo cuando alcanzás el 80% del límite presupuestado.
Cash Flow Negativo: Alerta temprana si tus proyecciones indican que te quedarás sin saldo operativo.
⏰ Recordatorios y Tareas
Vencimiento de Facturas: Avisos de fechas límite para evitar intereses.
Conciliación Pendiente: El sistema te recuerda cuando tenés movimientos "viejos" sin conciliar.
Carga de Datos: Recordatorios periódicos para mantener tu información al día.
3. Tecnología en Tiempo Real
Para asegurar que nunca te pierdas de nada, MyCFO utiliza una infraestructura híbrida:

WebSockets: Conectividad directa para recibir alertas instantáneas sin recargar la página.
Smart Polling: Un sistema de respaldo que consulta el servidor cada 10 segundos de forma silenciosa para asegurar que el centro de notificaciones esté siempre sincronizado.
Eventos Globales: El sistema está diseñado para que, si marcas una notificación como leída en el Drawer lateral, se refleje instantáneamente en el Listado principal (y viceversa) sin necesidad de refrescar el navegador.
4. Gestión de Preferencias
Aunque el sistema es automático, podés gestionar tu interacción:

Marcar todo como leído: Limpiá tu centro de alertas con un solo clic para empezar de cero.
Auditoría Retrospectiva: El sistema guarda un historial de hasta las últimas 50 notificaciones, permitiéndote revisar eventos pasados.
5. Integración con el Chatbot
La IA tiene acceso a tu flujo de notificaciones. Podés pedirle ayuda contextual:

"¿Por qué recibí tantas alertas de presupuesto ayer?"
"Resumime las notificaciones de pagos vencidos de esta semana."
"¿Qué movimientos de monto alto se detectaron en las últimas 48 horas?"
Guía Maestra de Recordatorios (/recordatorios)
El módulo de Recordatorios es tu agenda financiera personal dentro de MyCFO. A diferencia de las notificaciones automáticas del sistema, los recordatorios te permiten programar alertas a medida para no olvidar pagos, vencimientos o tareas administrativas.

1. Centro de Gestión de Recordatorios
Esta pantalla presenta tus tareas pendientes en un diseño de Tarjetas Dinámicas (estilo Masonry), permitiendo una lectura rápida y organizada.

Funcionalidades Principales:
Vista General: Visualización clara de título, descripción, fecha y hora de cada recordatorio.
Estado Vacío: El sistema te guía para crear tu primer aviso si aún no tenés ninguno.
Acceso Rápido: Botón destacado para crear nuevos recordatorios desde cualquier dispositivo.
2. Creación y Edición de Alertas
Al crear un recordatorio, contás con un formulario completo para definir cada detalle:

Título y Mensaje: Definí un nombre claro y una descripción detallada de la tarea (ej: "Pagar Seguro Local" - "Vence el 15, monto estimado: $45.000").
Tipos de Recordatorio: Aunque podés crear cualquier aviso, el sistema sugiere categorías comunes:
Personalizado: Para cualquier uso general.
Vencimiento: Ideal para compromisos de pago.
Carga de Datos: Para recordarte subir el Excel del mes o conciliar.
Vencimiento de Factura: Específico para proveedores o servicios.
Selección Precisa de Tiempo
Selector de Fecha: Calendario interactivo para elegir el día exacto.
Selector de Hora: Reloj de precisión para definir el momento de la alerta.
3. Sistema de Recurrencia
Podés automatizar tus avisos para evitar programarlos repetidamente:

Tipo	Uso sugerido
No recurrente	Tareas únicas (ej: "Renovar contrato").
Diario	Seguimiento de caja diario o revisión de saldos.
Semanal	Cierre de semana financiera (ej: todos los viernes).
Mensual	Pagos fijos, sueldos e impuestos (ej: día 10 de cada mes).
Anual	Renovación de dominios, seguros anuales o balances.
NOTE

Cuando un recordatorio es recurrente, MyCFO muestra un distintivo (Badge) azul indicando la frecuencia, para que sepas de un vistazo qué alertas se repetirán.

4. Funcionamiento Técnico y Notificaciones
Cuando llega el momento programado:

Generación de Alerta: El sistema dispara automáticamente una notificación interna.
Centro de Notificaciones: Verás aparecer el aviso en el Drawer lateral y en la pantalla de /listado-notificaciones.
App Móvil / Desktop: Recibirás el aviso visual en tiempo real gracias a la tecnología de WebSockets integrada.
5. Integración con el Chatbot
El Chatbot tiene acceso a tu agenda de recordatorios. Podés interactuar con él para gestionar tus tiempos:

"¿Qué pagos tengo que hacer esta semana según mis recordatorios?"
"Creame un recordatorio para mañana a las 10 AM que diga: 'Revisar conciliación bancaria'."
"¿Tengo algún recordatorio mensual pendiente para hoy?"
TIP

Usá el Chatbot para agendar tareas rápidamente sin tener que completar el formulario manualmente; la IA se encarga de parsear la fecha y el título por vos.
Guía Maestra de Configuración de Notificaciones (/configuracion-notificaciones)
El panel de Configuración de Notificaciones te da el control total sobre cómo y cuándo MyCFO se comunica con vos. Permite equilibrar la seguridad (alertas inmediatas) con la productividad (resúmenes y horarios de silencio).

1. Canales de Comunicación
Podés activar o desactivar los canales de notificación de forma independiente:

Notificaciones por Email: El sistema enviará avisos directamente a tu casilla de correo para eventos críticos.
Notificaciones In-App: Alertas visuales dentro de la plataforma (Drawer lateral y Listado).
Email de Contacto: MyCFO permite definir una dirección de correo específica para recibir estas alertas, independiente de tu email de inicio de sesión.
2. Resúmenes de Actividad (Digest)
Si preferís no recibir alertas individuales, podés configurar envíos consolidados:

Tipo	Función
Resumen Diario	Envía un email cada 24 horas con toda la actividad financiera relevante del día.
Resumen Semanal	Un reporte ejecutivo de cierre de semana para revisar tendencias y tareas pendientes.
Hora de Entrega	Podés elegir a qué hora exacta querés recibir estos resúmenes (ej: 09:00 AM para arrancar el día informado).
3. Umbrales de Seguridad (Smart Thresholds)
Esta es una de las funciones más potentes para el control de gastos grandes o inusuales.

Movimientos Altos (ARS): Definí a partir de qué monto en Pesos querés recibir una alerta especial (ej: avisame si hay un gasto mayor a $200.000).
Movimientos Altos (USD): Umbral independiente para gastos en Dólares (ej: avisame si hay un egreso mayor a USD 1.000).
IMPORTANT

Estos umbrales ayudan a detectar fraudes o errores de carga humanos de forma instantánea al disparar una notificación de alta prioridad.

4. Horarios de Silencio (Do Not Disturb)
Para que MyCFO no interrumpa tu descanso o tiempo fuera del trabajo, podés configurar el Modo Silencio:

Inicio y Fin del Silencio: Definí la franja horaria donde las notificaciones (excepto las críticas) se silenciarán (ej: de 22:00 a 08:00).
Días de Silencio: Podés elegir días específicos (como sábados y domingos) para no recibir alertas automáticas.
5. Control Granular por Tipo de Evento
MyCFO permite activar/desactivar cada tipo de notificación de forma individual. Podés elegir qué recibir por Email y qué solo ver dentro de la App:

Operativa: Importación de movimientos, vinculación de Mercado Pago.
Presupuestos: Creación, eliminación y alertas de límites.
Reportes: Aviso de reportes generados y resúmenes mensuales listos.
Recordatorios: Alertas sobre tus propias tareas programadas.
6. Sincronización y Guardado
Guardado Seguro: Los cambios no se aplican hasta que presiones el botón "Guardar Preferencias". El sistema valida que el email sea correcto y que los horarios tengan sentido.
Persistencia Multi-Dispositivo: Una vez que configuras tus preferencias, MyCFO las aplica en todos los dispositivos donde uses la App (celular, tablet o computadora).
7. Consejos de Configuración
TIP

Para dueños ocupados: Desactivá las alertas individuales y activá el Daily Digest a las 09:00 AM para tener un panorama completo sin distracciones durante el día. Para auditoría de caja: Establecé un umbral de Movimiento Alto bajo (ej: $50.000) y mantené activadas las notificaciones por Email para esos montos específicos.
Guía Maestra de Perfil de Usuario (/perfil)
El módulo de Perfil es tu espacio personal en MyCFO. Desde aquí gestionás tu identidad digital, personalizás la estética de tu cuenta y asegurás el acceso a tu información financiera.

1. Información Personal
MyCFO permite mantener tus datos de contacto siempre actualizados mediante Campos Editables dinámicos:

Nombre Completo: Tu nombre tal como aparecerá en reportes, registros de auditoría y el saludo del Dashboard.
Email: La dirección principal para recibir reportes y notificaciones automáticas.
Número de Teléfono: Tu contacto para soporte y coordinaciones operativas.
Cómo Editar:
Hacé clic sobre el valor que deseás cambiar.
El campo se transformará en un cuadro de texto editable.
Una vez modificado, aparecerá el botón de "Guardar Cambios" al final de la pantalla para consolidar la información en el sistema.
2. Personalización Visual (Avatar)
Podés elegir cómo te ves ante el resto del equipo o simplemente personalizar tu propia experiencia visual:

Selector de Colores: Disponés de una paleta de 10 colores premium (vibrantes y discretos) para el fondo de tu avatar.
Previsualización en Tiempo Real: Verás un círculo con la inicial de tu nombre sobre el color seleccionado antes de guardar.
Legibilidad Inteligente: El sistema detecta si elegiste un color claro u oscuro y ajusta automáticamente el color de la letra (Blanco o Negro) para que tu inicial siempre sea legible.
NOTE

Al guardar tu color preferido, el Sidebar (menú lateral) y la Topbar (barra superior) se actualizarán instantáneamente sin necesidad de recargar la página.

3. Seguridad de la Cuenta
La protección de tus datos financieros empieza con una contraseña segura.

Cambio de Contraseña: MyCFO incluye un diálogo de seguridad donde debés ingresar tu contraseña actual seguida de la nueva contraseña (mínimo 6 caracteres).
Validación de Seguridad: El sistema valida en tiempo real que las contraseñas coincidan y que la contraseña actual sea correcta antes de realizar el cambio en la base de datos distribuida.
4. Gestión de Datos y Privacidad
MyCFO respeta tu Derecho a la Portabilidad.

Descarga de Mis Datos: Con un solo clic, podés obtener una copia completa de tu información personal en formato JSON.
Contenido del Archivo: Incluye tu nombre, contacto, color de avatar preferido y la fecha exacta de la exportación. Esto es útil para auditorías personales o para migrar tu información si fuera necesario.
5. Integración con la Organización
Preferencias de Notificaciones: Desde el perfil tenés un acceso directo para configurar qué alertas querés recibir (Web/Email), integrando tu identidad con el sistema de comunicación reactiva del sistema.
Sincronización de Sesión: Los cambios realizados en el perfil se reflejan automáticamente en todas tus sesiones activas, garantizando que tu experiencia sea consistente en cualquier dispositivo.
6. Consejos de Uso
TIP

Identificación por Color: Si trabajas en un equipo con varios colaboradores, usá colores distintos para cada usuario. Esto facilita identificar quién cargó un movimiento o quién hizo un ajuste de presupuesto al revisar los registros de auditoría visualmente.
Guía Maestra de Organización (/organizacion)
El módulo de Organización es el centro de comando para la identidad corporativa y la gestión del capital humano en MyCFO. Permite centralizar los datos legales de la empresa y controlar quién tiene acceso a la información financiera.

1. Información de la Empresa
Centralizá los datos fiscales y de contacto de tu entidad. Esta información es la base para la generación de reportes y la configuración de integraciones.

Datos Gestionables:
Nombre de la Empresa: El nombre legal o de fantasía de tu organización.
CUIT: Clave Única de Identificación Tributaria (fundamental para trámites impositivos).
Condición IVA: Estado frente al impuesto (Responsable Inscripto, Monotributista, etc.).
Domicilio: Dirección física de la sede central o fiscal.
IMPORTANT

Permisos de Edición: Por seguridad, solo los usuarios con rol de Administrador o Dueño pueden modificar estos datos. Los colaboradores normales solo tienen acceso de lectura.

2. Gestión del Equipo (Empleados)
Visualizá y gestioná a todas las personas que forman parte de tu suscripción de MyCFO.

Panel de Control de Empleados:
Listado Paginado: Para facilitar la navegación en empresas grandes, los empleados se muestran en grupos de 3 (ajustable según configuración).
Fichas Informativas: Cada empleado muestra su Nombre, Email, Teléfono, Rol y Estado (Activo/Inactivo).
Etiquetas de Rol (Chips): Identificá de un vistazo quién es Admin, Dueño o usuario normal ("Tú" marca tu propia cuenta).
Acciones Administrativas:
Edición Inline: Modificá el nombre, email, teléfono o rol de un colaborador sin salir de la lista.
Eliminación Segura: MyCFO protege la integridad de tu equipo. Para eliminar a alguien, el sistema solicitará una confirmación doble para evitar borrados accidentales.
Auto-Protección: No podés eliminar tu propia cuenta; esto garantiza que siempre quede al menos un administrador activo en el sistema.
3. Roles e Integración de Acceso
Desde este módulo tenés accesos directos estratégicos para el crecimiento de tu estructura:

Gestionar Roles: Acceso directo al módulo de /roles para definir qué puede hacer cada perfil (ver balances, cargar facturas, etc.).
Invitar Colaboradores: ¿Necesitás sumar a alguien más? El botón "Ir a Invitaciones" te lleva al flujo de envío de correos de invitación para nuevos miembros.
4. Interfaz Adaptativa (Mobile & Tablet)
El panel de organización está optimizado para dispositivos móviles:

Vistas Compactas: En celulares, la información se apila verticalmente para una lectura cómoda.
Acciones Rápidas: Los botones de edición y eliminación se adaptan para ser accionados fácilmente de forma táctil.
5. Consejos para Administradores
TIP

Auditoría de Acceso: Revisá periódicamente la lista de empleados. Si alguien deja de formar parte de la empresa, recordá eliminar su acceso o cambiar su estado para mantener la seguridad de tus datos bancarios y financieros.
Guía Maestra de Roles y Permisos (/roles)
El módulo de Roles es el guardián de la seguridad en MyCFO. Permite a los administradores definir con precisión quirúrgica qué información puede ver o modificar cada miembro del equipo, garantizando la confidencialidad de los datos financieros sensibles.

1. Niveles de Acceso (Access Levels)
MyCFO utiliza un sistema visual de "Sliders" para definir el poder de cada usuario sobre los módulos. Los permisos se dividen en tres estados:

Bloqueado (Icono Candado): El usuario no tiene acceso al módulo ni puede verlo en su menú.
Solo Lectura (Icono Ojo): El usuario puede ver la información, gráficos y tablas, pero no puede crear, editar ni borrar nada.
Acceso Total (Icono Lápiz): Permiso de edición completo. El usuario puede operar libremente en esa sección.
Lógica de Cascada:
El sistema incluye reglas de coherencia inteligentes:

Si activás Editar, el permiso de Ver se activa automáticamente.
Si desactivás Ver, el permiso de Editar se bloquea instantáneamente.
2. Jerarquía de Rangos
Más allá de los permisos por módulo, existen rangos que definen capacidades administrativas:

Rango	Icono	Alcance
Dueño	👑	Acceso total absoluto. No puede ser eliminado ni degradado.
Administrador	🛡️	Tiene acceso total a todos los módulos por defecto y puede gestionar los permisos de otros colaboradores.
Colaborador	👤	Solo tiene acceso a los módulos que un Administrador le haya habilitado explícitamente.
IMPORTANT

Auto-Protección: Por seguridad, un usuario no puede "degradarse" a sí mismo ni quitarse permisos de administrador si es el único activo, para evitar que la organización quede sin mando.

3. Configuración Granular por Módulo
Podés ajustar los permisos para cada una de las 8 áreas clave:

Carga de Datos / Gestión Bancaria / Movimientos: Control de ingresos y egresos.
Facturas / Conciliación: Auditoría y verificación de cuentas.
Reportes / Pronóstico (IA): Acceso a inteligencia de negocio y predicciones.
Presupuestos: Planificación financiera a futuro.
4. Funcionamiento Técnico (Persistencia)
Para los desarrolladores y auditores técnicos, es importante saber que los permisos se almacenan de forma compacta en el campo 
rol
 del usuario con el siguiente formato: RANGO|PERM:{"modulo":{"view":true,"edit":false}}|COLOR:#HEX

Sincronización Instantánea: Al guardar, MyCFO actualiza las sesiones de los usuarios activos mediante eventos globales, aplicando los nuevos límites de acceso de inmediato sin que el usuario deba cerrar sesión.
5. Interfaz Mobile (Seguridad en el Bolsillo)
En dispositivos móviles, la tabla se transforma en Tarjetas de Seguridad individuales por miembro.

Cada tarjeta resume el rango del usuario y permite desplegar el selector de niveles para cada módulo de forma táctil y cómoda.
Mantiene toda la potencia administrativa en una pantalla reducida.
6. Consejos de Seguridad
TIP

Principio de Privacidad: Aplicá siempre el "Principio de Menor Privilegio". Dale a cada colaborador solo el acceso que necesita para su tarea. Por ejemplo, un contador externo puede tener acceso de "Solo Lectura" en Reportes y Movimientos, pero "Acceso Total" en Conciliación. Uso de la IA: El Chatbot también respeta estos permisos. Si un usuario no tiene permiso para ver Presupuestos, la IA se negará a responder preguntas sobre el estado de las metas presupuestarias.
Guía Maestra de Invitaciones (/invitaciones)
El módulo de Invitaciones es la puerta de entrada para nuevos talentos a tu equipo financiero en MyCFO. Permite escalar tu estructura operativa de forma segura y controlada.

1. Proceso de Invitación de Miembros
MyCFO facilita la expansión del equipo permitiendo invitar a múltiples colaboradores en un solo paso.

Paso a paso:
Ingreso de Emails: Usá el cuadro de texto multilínea para ingresar las direcciones de correo.
Podés separar los emails con comas o presionando Enter.
El sistema reconoce automáticamente cada dirección de forma independiente.
Validación: MyCFO verifica que el formato de los correos sea válido antes de habilitar el envío.
Despacho Masivo: Al presionar "Enviar Invitaciones", el sistema procesa toda la lista y despacha los correos electrónicos correspondientes de forma asincrónica.
2. Seguridad y Restricciones
La capacidad de invitar a otros es un privilegio crítico:

Solo Administradores: Únicamente los usuarios con rango de Administrador o Dueño pueden ver y utilizar este módulo.
Trazabilidad: Cada invitación enviada queda registrada con el ID del usuario que la generó, permitiendo auditar quién invitó a quién en el futuro.
Control Corporativo: Las invitaciones están ligadas específicamente a tu Organización, garantizando que los nuevos miembros solo accedan a tus datos financieros.
3. Experiencia de Usuario (Feedback)
El sistema te mantiene informado sobre el estado de tus invitaciones:

Indicadores de Carga: Durante el envío, verás un estado de "Enviando..." para confirmar que el proceso está en marcha.
Alertas de Éxito: Un mensaje verde confirmará cuántas invitaciones fueron enviadas exitosamente.
Manejo de Errores: Si un email ya estaba invitado o hubo un problema técnico, MyCFO te mostrará el mensaje de error específico (ej: "El usuario ya pertenece a la organización").
4. El Onboarding del Invitado
¿Qué pasa después del envío?

Email de Bienvenida: El invitado recibe un correo oficial de MyCFO con el nombre de tu empresa.
Enlace Único: El correo contiene un enlace de registro seguro que vincula automáticamente al nuevo usuario con tu organización.
Primer Inicio: Una vez registrado, el nuevo miembro aparecerá automáticamente en tu listado de /organizacion con el rol predeterminado de Colaborador.
5. Consejos de Gestión
TIP

Planificación de Roles: Inmediatamente después de que un invitado acepte la invitación, recordá ir al módulo de /roles para ajustar sus permisos granulares. Por defecto, entrará con los permisos mínimos de lectura. Emails Corporativos: Se recomienda usar siempre cuentas de correo institucionales para garantizar que la información financiera se mantenga dentro del dominio de la empresa.
