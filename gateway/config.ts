export interface ServiceConfig {
  name: string;
  url: string;
  port: number;
  healthEndpoint: string;
  timeout: number;
  retries: number;
}

export interface GatewayConfig {
  port: number;
  services: {
    auth: ServiceConfig;
    user: ServiceConfig;
    product: ServiceConfig;
    order: ServiceConfig;
  };
  rateLimit: {
    windowMs: number;
    max: number;
  };
  cors: {
    origins: string[];
    credentials: boolean;
  };
  security: {
    jwtSecret: string;
    jwtRefreshSecret: string;
    tokenExpiry: string;
    refreshTokenExpiry: string;
  };
}

const defaultConfig: GatewayConfig = {
  port: parseInt(process.env.GATEWAY_PORT || '12000'),
  services: {
    auth: {
      name: 'auth-service',
      url: process.env.AUTH_SERVICE_URL || 'http://localhost:12004',
      port: parseInt(process.env.AUTH_SERVICE_PORT || '12004'),
      healthEndpoint: '/health',
      timeout: 15000, // Increased timeout for auth operations
      retries: 3
    },
    user: {
      name: 'user-service',
      url: process.env.USER_SERVICE_URL || 'http://localhost:12001',
      port: parseInt(process.env.USER_SERVICE_PORT || '12001'),
      healthEndpoint: '/health',
      timeout: 5000,
      retries: 3
    },
    product: {
      name: 'product-service',
      url: process.env.PRODUCT_SERVICE_URL || 'http://localhost:12002',
      port: parseInt(process.env.PRODUCT_SERVICE_PORT || '12002'),
      healthEndpoint: '/health',
      timeout: 5000,
      retries: 3
    },
    order: {
      name: 'order-service',
      url: process.env.ORDER_SERVICE_URL || 'http://localhost:12003',
      port: parseInt(process.env.ORDER_SERVICE_PORT || '12003'),
      healthEndpoint: '/health',
      timeout: 5000,
      retries: 3
    }
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // requests per window
  },
  cors: {
    origins: process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:12000'
    ],
    credentials: true
  },
  security: {
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-this-in-production',
    tokenExpiry: process.env.JWT_EXPIRY || '1h',
    refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d'
  }
};

export const gatewayConfig: GatewayConfig = defaultConfig;

// Service discovery helper
export const getServiceUrl = (serviceName: keyof GatewayConfig['services']): string => {
  return gatewayConfig.services[serviceName].url;
};

// Health check helper
export const getServiceHealthUrl = (serviceName: keyof GatewayConfig['services']): string => {
  const service = gatewayConfig.services[serviceName];
  return `${service.url}${service.healthEndpoint}`;
};

// Service status checker
export const checkServiceHealth = async (serviceName: keyof GatewayConfig['services']): Promise<boolean> => {
  try {
    const healthUrl = getServiceHealthUrl(serviceName);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), gatewayConfig.services[serviceName].timeout);
    
    const response = await fetch(healthUrl, {
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error(`Health check failed for ${serviceName}:`, error);
    return false;
  }
};

// Get all services health status
export const getAllServicesHealth = async (): Promise<Record<string, boolean>> => {
  const services = Object.keys(gatewayConfig.services) as Array<keyof GatewayConfig['services']>;
  const healthPromises = services.map(async (serviceName) => {
    const isHealthy = await checkServiceHealth(serviceName);
    return { [serviceName]: isHealthy };
  });
  
  const results = await Promise.all(healthPromises);
  return results.reduce((acc, curr) => ({ ...acc, ...curr }), {});
};
