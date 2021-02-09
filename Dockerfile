FROM node:12

# stop core-js & nodemon console spam
ENV ADBLOCK 1
ENV SUPPRESS_SUPPORT 1

WORKDIR /usr/src/sg
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 46374
CMD [ "npm", "run", "start" ]