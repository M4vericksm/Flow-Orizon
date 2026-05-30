# ---- build ----
# Imagens Debian (não-alpine) por compatibilidade ampla com o Docker host.
FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# A URL da API é embutida no bundle em tempo de build (o navegador acessa
# o backend pela porta publicada no host).
ARG VITE_API_URL=http://localhost:8000/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ---- serve ----
FROM nginx:stable
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
