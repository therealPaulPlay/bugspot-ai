FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

RUN npm install

# Bundle app source
COPY . .

# Purely informational since we use --network host
EXPOSE 3010

CMD [ "node", "server.js" ]