FROM node:20-slim

WORKDIR /app

# Copy package files first for the same Docker layer-caching reason as the
# backend Dockerfile - dependency installs get cached separately from code.
COPY package.json ./
RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev"]
