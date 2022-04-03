FROM node:16
RUN apt-get update || : && apt-get install python -y
WORKDIR "/app"
COPY ./package.json ./
COPY ./package-lock.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
