module.exports = {
  // Gateway configuration
  gateway: {
    port: process.env.GATEWAY_PORT || 3000,
    host: process.env.GATEWAY_HOST || 'localhost'
  },
  
  // Service discovery configuration
  services: {
    'auth-service': {
      url: process.env.AUTH_SERVICE_URL || 'http://localhost:12004',
      timeout: 5000,
      retries: 3,
      healthCheck: '/health',
      routes: ['/api/auth']
    },
    'user-service': {
      url: process.env.USER_SERVICE_URL || 'http://localhost:12001',
      timeout: 5000,
      retries: 3,
      healthCheck: '/health',
      routes: ['/api/users', '/api/users/staff', '/api/users/all']
    },
    'product-service': {
      url: process.env.PRODUCT_SERVICE_URL || 'http://localhost:12002',
      timeout: 5000,
      retries: 3,
      healthCheck: '/health',
      routes: ['/api/products', '/api/categories']
    },
    'order-service': {
      url: process.env.ORDER_SERVICE_URL || 'http://localhost:12003',
      timeout: 5000,
      retries: 3,
      healthCheck: '/health',
      routes: ['/api/orders', '/api/payments']
    }
  },
  
  // Rate limiting configuration
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // requests per window
    skipSuccessfulRequests: false
  },
  
  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
  }
};
