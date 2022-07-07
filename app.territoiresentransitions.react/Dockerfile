FROM node:16
RUN apt-get update \
    && apt-get install -y locales \
    && rm -rf /var/lib/apt/lists/* \
    && locale-gen "fr_FR.UTF-8"
ENV LANG fr_FR.UTF-8
WORKDIR "/app"
COPY ./package.json ./
COPY ./package-lock.json ./
RUN npm i
COPY . .
EXPOSE 3000
