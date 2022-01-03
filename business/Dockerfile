# This is a simple Dockerfile to use while developing
# It's not suitable for production
#

FROM python:3.9

RUN mkdir -p /business
WORKDIR /business

COPY . .
COPY .env.docker .env
RUN pip install pipenv
RUN pipenv install 
# RUN pip install --upgrade pip
RUN pipenv install -e .

WORKDIR /business

CMD ["pipenv", "run", "python", "-u", "business/evaluation/entrypoints/realtime.py"]

