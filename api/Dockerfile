# This is a simple Dockerfile to use while developing
# It's not suitable for production
#

FROM python:3.9

WORKDIR /api

COPY . .
RUN pip install -U pipenv
RUN pipenv install
RUN pipenv install --dev

CMD ["pipenv", "run", "serve"]

