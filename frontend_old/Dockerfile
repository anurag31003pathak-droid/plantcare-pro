# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Copy package.json and package-lock.json (if exists)
# In our setup, package.json might not be fully persisted due to EPERM errors during scaffolding, 
# but assuming standard vite setup for production:
COPY package.json package-lock.json* ./

# Install dependencies (ignoring errors if lockfile is missing)
RUN npm install

# Copy source
COPY . .

# Replace localhost with actual backend URL in env if needed
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from build stage to nginx serve directory
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
