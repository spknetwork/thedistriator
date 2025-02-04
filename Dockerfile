FROM node:18
RUN mkdir app
WORKDIR /app
COPY package.json /app/package.json
RUN npm install
COPY . /app
CMD ["npm", "run", "start"]