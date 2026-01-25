@echo off
setlocal

rem Credenciales y host (ajusta si usas otras)
set "HOST=localhost"
set "USER=root"
set "PASSWORD=root"
set "CHARSET=utf8mb4"

rem Ruta al binario mysql (ajusta si tu instalacion esta en otra carpeta, ej: XAMPP)
set "MYSQL_BIN=C:\Program Files\MySQL\MySQL Workbench 8.0\mysql.exe"
if not exist "%MYSQL_BIN%" (
  echo No se encontro mysql.exe en "%MYSQL_BIN%".
  echo Ajusta la variable MYSQL_BIN en este bat.
  goto :eof
)

rem Carpeta donde estan los SQL
if exist "%~dp0scripts-pruebas" (
  set "SCRIPTS_DIR=%~dp0scripts-pruebas"
) else (
  set "SCRIPTS_DIR=C:\Users\Raul\Documents\UTN\5. Quinto Año\2. Proyecto Final\MyCFO Entrega Final\scripts-pruebas"
)

if not exist "%SCRIPTS_DIR%" (
  echo No se encontro la carpeta de scripts en "%SCRIPTS_DIR%".
  echo Ajusta la variable SCRIPTS_DIR en este bat.
  goto :eof
)

rem Registro
"%MYSQL_BIN%" --default-character-set=%CHARSET% -h %HOST% -u %USER% -p%PASSWORD% registro_db < "%SCRIPTS_DIR%\registros-facturas.sql"

rem Presupuestos (Pronostico)
"%MYSQL_BIN%" --default-character-set=%CHARSET% -h %HOST% -u %USER% -p%PASSWORD% pronostico_db < "%SCRIPTS_DIR%\presupuesto 2023.sql"
"%MYSQL_BIN%" --default-character-set=%CHARSET% -h %HOST% -u %USER% -p%PASSWORD% pronostico_db < "%SCRIPTS_DIR%\presupuesto 2024.sql"
"%MYSQL_BIN%" --default-character-set=%CHARSET% -h %HOST% -u %USER% -p%PASSWORD% pronostico_db < "%SCRIPTS_DIR%\presupuesto 2025.sql"

rem Notificaciones
"%MYSQL_BIN%" --default-character-set=%CHARSET% -h %HOST% -u %USER% -p%PASSWORD% notificacion_db < "%SCRIPTS_DIR%\notificaciones_recordatorios_demo.sql"

echo Listo.
endlocal
