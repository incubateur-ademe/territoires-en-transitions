# This is a simple Dockerfile to use while developing to run the service locally

FROM python:3.9

RUN mkdir -p /business
WORKDIR /business

COPY . .
RUN pip install pipenv
RUN pipenv install
RUN pipenv install -e .

CMD ["pipenv", "run", "python", "-u", "business/evaluation/entrypoints/start_realtime.py"]

