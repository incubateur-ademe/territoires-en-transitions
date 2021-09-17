FROM node:14.15.1-alpine as builder
WORKDIR "/app"
COPY ./package.json ./
COPY ./package-lock.json ./
RUN npm install
COPY . .
RUN npm run build -- --prod

FROM nginx
EXPOSE 3000
COPY ./default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/build /usr/share/nginx/html