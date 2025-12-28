# Stage 1: Build the application
FROM node:20-alpine as builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code and build
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy the template file for envsubst
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Default port to 8080 (Cloud Run will override this)
ENV PORT=8080

EXPOSE 8080

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
