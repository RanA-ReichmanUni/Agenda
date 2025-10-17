# Use Node.js 20 (required by some deps like got@14)
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Install build tools needed for native modules (e.g., re2 via node-gyp)
RUN apk add --no-cache python3 make g++

# Install dependencies first (better cache)
COPY package*.json ./
# Prefer clean, reproducible installs; fall back to install if lock file missing
RUN npm ci || npm install

# Copy the rest of the app
COPY . .

# Expose Next.js dev/prod port
EXPOSE 3000

# Default command runs dev server; compose can override if needed
CMD ["npm", "run", "dev"]
