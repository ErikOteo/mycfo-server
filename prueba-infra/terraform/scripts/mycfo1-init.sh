#!/bin/bash
set -e

# Variables
MYCFO2_URL="${mycfo2_url}"
APP_TEST_ENV_VAR="${app_test_env_var}"
AWS_REGION="${aws_region}"
SECRET_NAME="${secret_name}"

# Actualizar sistema
dnf update -y

# Instalar Java 17 (requerido para Spring Boot)
dnf install -y java-17-amazon-corretto

# Instalar AWS CLI v2 (ya viene en Amazon Linux 2023)
# No es necesario instalarlo, pero actualizamos si es necesario

# Crear directorio para la aplicación
mkdir -p /opt/mycfo1
cd /opt/mycfo1

# Crear archivo de configuración de aplicación
cat > application.properties <<EOF
# Variables de entorno inyectadas
MYCFO2_URL=http://$MYCFO2_URL:8081
APP_TEST_ENV_VAR=$APP_TEST_ENV_VAR
AWS_REGION=$AWS_REGION
SPRING_CLOUD_AWS_SECRETSMANAGER_SECRET_NAME=$SECRET_NAME
EOF

# Crear script de inicio para la aplicación
cat > start.sh <<'SCRIPT'
#!/bin/bash
cd /opt/mycfo1

# Cargar variables de entorno desde application.properties
source application.properties

# Verificar si el JAR existe
JAR_FILE=$(ls mycfo1-*.jar 2>/dev/null | head -n 1)
if [ -z "$JAR_FILE" ]; then
    echo "Error: No se encontró el archivo JAR. Por favor, sube mycfo1-*.jar a /opt/mycfo1"
    exit 1
fi

# Detener la aplicación si ya está corriendo
if [ -f "app.pid" ]; then
    OLD_PID=$(cat app.pid)
    if ps -p $OLD_PID > /dev/null 2>&1; then
        echo "Deteniendo aplicación anterior (PID: $OLD_PID)"
        kill $OLD_PID
        sleep 2
    fi
    rm -f app.pid
fi


# Ejecutar la aplicación
echo "Iniciando MyCFO1..."
nohup java -jar \
    -DMYCFO2_URL="$MYCFO2_URL" \
    -DAPP_TEST_ENV_VAR="$APP_TEST_ENV_VAR" \
    -DAWS_REGION="$AWS_REGION" \
    -DSPRING_CLOUD_AWS_SECRETSMANAGER_SECRET_NAME="$SPRING_CLOUD_AWS_SECRETSMANAGER_SECRET_NAME" \
    $JAR_FILE > app.log 2>&1 &

# Guardar el PID
echo $! > app.pid
echo "MyCFO1 iniciado (PID: $(cat app.pid))"
echo "Logs en: /opt/mycfo1/app.log"
SCRIPT

# Crear script para detener la aplicación
cat > stop.sh <<'SCRIPT'
#!/bin/bash
cd /opt/mycfo1

if [ -f "app.pid" ]; then
    PID=$(cat app.pid)
    if ps -p $PID > /dev/null 2>&1; then
        echo "Deteniendo MyCFO1 (PID: $PID)"
        kill $PID
        rm -f app.pid
        echo "MyCFO1 detenido"
    else
        echo "La aplicación no está corriendo"
        rm -f app.pid
    fi
else
    echo "No se encontró el PID. La aplicación puede no estar corriendo."
fi
SCRIPT

chmod +x start.sh stop.sh

# Crear servicio systemd para auto-inicio
cat > /etc/systemd/system/mycfo1.service <<EOF
[Unit]
Description=MyCFO1 Spring Boot Application
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/opt/mycfo1
ExecStart=/usr/bin/java -jar -DMYCFO2_URL=http://$MYCFO2_URL:8081 -DAPP_TEST_ENV_VAR=$APP_TEST_ENV_VAR -DAWS_REGION=$AWS_REGION -DSPRING_CLOUD_AWS_SECRETSMANAGER_SECRET_NAME=$SECRET_NAME /opt/mycfo1/mycfo1-*.jar
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
# No activamos el servicio automáticamente, debe iniciarse manualmente después de subir el JAR

echo "MyCFO1 initialization completed"
echo "Pasos siguientes:"
echo "1. Sube el archivo mycfo1-*.jar a /opt/mycfo1"
echo "2. Ejecuta: /opt/mycfo1/start.sh"
echo "O para iniciar como servicio: systemctl start mycfo1 && systemctl enable mycfo1"

