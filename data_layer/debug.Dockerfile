# This is a simple Dockerfile to use while debugging so we don't use pipenv

FROM python:3.9

RUN mkdir -p /data_layer
WORKDIR /data_layer

COPY . .
RUN pip install pipenv
RUN pip install pytest
RUN pipenv install
RUN pipenv install -e .
RUN pipenv run pip freeze > requirements.txt
RUN pip install -r requirements.txt
