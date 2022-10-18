# This is a simple Dockerfile to use while developing to run the service locally

FROM python:3.9

WORKDIR /business

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
RUN pip install -e .
EXPOSE 8888

CMD ["uvicorn", "evaluation_api:app", "--host", "0.0.0.0", "--port", "8888"]
