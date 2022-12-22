# Comments
FROM node:16

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

ENV PORT 3000
EXPOSE $PORT

CMD [ "npm", "start" ]