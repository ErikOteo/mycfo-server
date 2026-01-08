# Usamos una imagen de Python normal (no Lambda)
FROM python:3.10-slim

# Definir carpeta de trabajo
WORKDIR /app

# Instalar librerías del sistema necesarias para Prophet y Numpy
# (gcc, g++, libgomp1 son vitales para cálculos matemáticos)
RUN apt-get update && apt-get install -y \
    build-essential \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Actualizar pip
RUN pip install --no-cache-dir --upgrade pip

# Instalar librerías de Python
RUN pip install --no-cache-dir \
    numpy \
    pandas \
    matplotlib \
    scipy \
    scikit-learn \
    statsmodels \
    prophet \
    flask \
    flask-cors \
    joblib

# Copiar el código a la carpeta /app
COPY app.py .

# Exponer el puerto 8088
EXPOSE 8088

# Ejecutar como servidor web normal
CMD ["python", "app.py"]