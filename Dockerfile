FROM node:18-alpine

WORKDIR /usr/src/app

COPY . /usr/src/app

CMD ["node", "auto-run.js", "config.json"]