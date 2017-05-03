FROM node:6.9.1
COPY . /app
WORKDIR /app
RUN npm install
RUN npm install -g gulp
ENTRYPOINT ['gulp']
