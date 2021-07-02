FROM node:14.17-alpine

RUN mkdir /epub-to-webpub

WORKDIR /epub-to-webpub

ENV PORT=5000

COPY package.json /epub-to-webpub
RUN npm install

COPY . /epub-to-webpub

CMD echo $(ls -la)

EXPOSE $PORT

RUN npm run build

CMD node dist/container.js