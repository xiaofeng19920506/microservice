# Use Node.js 18 Alpine image for smaller size
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies for building native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy auth service source code
COPY auth/ ./auth/

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S auth-service -u 1001

# Change ownership of the app directory
RUN chown -R auth-service:nodejs /app
USER auth-service

# Expose port
EXPOSE 12004

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:12004/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "auth/server.js"]
