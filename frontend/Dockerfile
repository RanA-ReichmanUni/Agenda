# Simple Vite + React dev container
FROM node:20-alpine

WORKDIR /app

# Install OS deps for node-gyp if needed
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package.json ./

# Install dependencies
RUN npm install

# Copy rest of the application
COPY . .

EXPOSE 5173
CMD ["npm", "run", "dev"]
