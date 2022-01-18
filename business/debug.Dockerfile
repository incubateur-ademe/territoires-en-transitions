# This is a simple Dockerfile to use while debugging so we don't use pipenv

FROM python:3.9

RUN mkdir -p /business
WORKDIR /business

COPY . .
COPY .env.docker .env
RUN pip install pipenv
RUN pip install pytest
RUN pipenv install
RUN pipenv install -e .
RUN pipenv run pip freeze > requirements.txt
RUN pip install -r requirements.txt

WORKDIR /business

CMD ["pipenv", "run", "python", "-u", "business/evaluation/entrypoints/realtime.py"]

