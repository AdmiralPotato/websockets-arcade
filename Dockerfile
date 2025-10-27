# our base image
FROM node:22-slim

# specify the port number the container should expose
EXPOSE 3000

# setup for things needed on this layer
WORKDIR /root
COPY ./public ./public/
COPY ./*.js ./
COPY ./package.json ./
COPY ./package-lock.json ./
RUN npm install

# run the application
# NEVER EVER EVER JUST `CMD npm start` BECAUSE THEN CTRL-C WILL NEVER STOP IT!
CMD ["npm", "start"]
