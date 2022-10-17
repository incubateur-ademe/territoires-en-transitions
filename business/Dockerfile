# This is a simple Dockerfile to use while developing to run the service locally

FROM python:3.9
RUN pip install fastapi
RUN pip install "uvicorn[standard]"
RUN pip install lark # todo shouldn't be needed

RUN mkdir -p /business
WORKDIR /business

COPY . .
RUN pip install pipenv
RUN pipenv install
RUN pipenv install -e .

CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8888"]
