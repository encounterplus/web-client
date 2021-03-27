# Stage1
FROM node:lts as node

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

RUN npm install -g @angular/cli 

COPY . .

RUN ng build

# Stage 2
FROM nginx:stable-alpine
COPY --from=node /usr/src/app/dist/external-screen /usr/share/nginx/html

EXPOSE 80
