#!/bin/bash
set -e

# Variables
AWS_REGION="${aws_region}"
SECRET_NAME="${secret_name}"

# Actualizar sistema
dnf update -y

# Instalar Java 17 (requerido para Spring Boot)
dnf install -y java-17-amazon-corretto

# Instalar AWS CLI v2 (ya viene en Amazon Linux 2023)
# No es necesario instalarlo, pero actualizamos si es necesario

# Crear directorio para la aplicación
mkdir -p /opt/mycfo2
cd /opt/mycfo2

# Crear archivo de configuración de aplicación
cat > application.properties <<EOF
# Variables de entorno inyectadas
AWS_REGION=$AWS_REGION
SPRING_CLOUD_AWS_SECRETSMANAGER_SECRET_NAME=$SECRET_NAME
EOF

# Crear script de inicio para la aplicación
cat > start.sh <<'SCRIPT'
#!/bin/bash
cd /opt/mycfo2

# Cargar variables de entorno desde application.properties
source application.properties

# Verificar si el JAR existe
JAR_FILE=$(ls mycfo2-*.jar 2>/dev/null | head -n 1)
if [ -z "$JAR_FILE" ]; then
    echo "Error: No se encontró el archivo JAR. Por favor, sube mycfo2-*.jar a /opt/mycfo2"
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
echo "Iniciando MyCFO2..."
nohup java -jar \
    -DAWS_REGION="$AWS_REGION" \
    -DSPRING_CLOUD_AWS_SECRETSMANAGER_SECRET_NAME="$SPRING_CLOUD_AWS_SECRETSMANAGER_SECRET_NAME" \
    $JAR_FILE > app.log 2>&1 &

# Guardar el PID
echo $! > app.pid
echo "MyCFO2 iniciado (PID: $(cat app.pid))"
echo "Logs en: /opt/mycfo2/app.log"
SCRIPT

# Crear script para detener la aplicación
cat > stop.sh <<'SCRIPT'
#!/bin/bash
cd /opt/mycfo2

if [ -f "app.pid" ]; then
    PID=$(cat app.pid)
    if ps -p $PID > /dev/null 2>&1; then
        echo "Deteniendo MyCFO2 (PID: $PID)"
        kill $PID
        rm -f app.pid
        echo "MyCFO2 detenido"
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
cat > /etc/systemd/system/mycfo2.service <<EOF
[Unit]
Description=MyCFO2 Spring Boot Application
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/opt/mycfo2
ExecStart=/usr/bin/java -jar -DAWS_REGION=$AWS_REGION -DSPRING_CLOUD_AWS_SECRETSMANAGER_SECRET_NAME=$SECRET_NAME /opt/mycfo2/mycfo2-*.jar
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
# No activamos el servicio automáticamente, debe iniciarse manualmente después de subir el JAR

echo "MyCFO2 initialization completed"
echo "Pasos siguientes:"
echo "1. Sube el archivo mycfo2-*.jar a /opt/mycfo2"
echo "2. Ejecuta: /opt/mycfo2/start.sh"
echo "O para iniciar como servicio: systemctl start mycfo2 && systemctl enable mycfo2"

