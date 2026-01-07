FROM public.ecr.aws/lambda/python:3.10

# -------------------------------
# Actualizar pip
# -------------------------------
RUN pip install --no-cache-dir --upgrade pip

# -------------------------------
# Librerías requeridas por numpy/scipy/statsmodels
# -------------------------------
RUN yum install -y gcc gcc-c++ make \
    && yum install -y libgfortran libquadmath \
    && yum clean all

# -------------------------------
# Instalar dependencias Python
# -------------------------------
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

# -------------------------------
# Copiar tu aplicación
# -------------------------------
COPY app.py ${LAMBDA_TASK_ROOT}/app.py

# -------------------------------
# Comando handler
# -------------------------------
CMD ["app.lambda_handler"]
