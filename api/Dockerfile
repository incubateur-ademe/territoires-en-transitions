# This is a simple Dockerfile to use while developing
# It's not suitable for production
#

FROM python:3.9

RUN mkdir -p /code/api
WORKDIR /code

COPY . .
RUN pip install -U pipenv
RUN pipenv install
RUN pipenv install --dev


WORKDIR /code

CMD ["pipenv", "run", "serve"]

