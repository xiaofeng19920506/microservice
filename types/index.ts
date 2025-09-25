// User and Staff Types
export interface IUser {
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'user';
  avatar?: string;
  addresses: IAddress[];
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IStaff {
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'admin' | 'manager' | 'employee' | 'owner';
  avatar?: string;
  workingStore: IStore[];
  managedStore: IStore[];
  ownedStore: IStore[];
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IAddress {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  isDefault?: boolean;
  addressType?: 'home' | 'work' | 'billing' | 'shipping';
}

export interface IStore {
  storeId: string;
  storeName: string;
}

// Authentication Types
export interface IAuthRequest {
  email: string;
  password: string;
  isAdmin?: boolean;
}

export interface IRegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  isAdmin?: boolean;
  role?: string;
  department?: string;
  position?: string;
  workingStore?: IStore[];
  managedStore?: IStore[];
  ownedStore?: IStore[];
  avatar?: string;
  addresses?: IAddress[];
}

export interface ILoginResponse {
  success: boolean;
  data: {
    user?: IUser;
    staff?: IStaff;
    accessToken: string;
    refreshToken: string;
  };
  message: string;
}

export interface IRegisterResponse {
  success: boolean;
  data: {
    user?: IUser;
    staff?: IStaff;
    accessToken: string;
    refreshToken: string;
  };
  message: string;
}

// JWT Token Types
export interface IJWTPayload {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  userType: 'customer' | 'staff';
}

// API Response Types
export interface IApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  count?: number;
}

// Service Configuration Types
export interface IServiceConfig {
  url: string;
  timeout: number;
  retries: number;
  healthCheck: string;
  routes: string[];
}

export interface IGatewayConfig {
  gateway: {
    port: number;
    host: string;
  };
  services: {
    [key: string]: IServiceConfig;
  };
  rateLimit: {
    windowMs: number;
    max: number;
    skipSuccessfulRequests: boolean;
  };
  cors: {
    origin: string;
    credentials: boolean;
  };
}

// Environment Variables
export interface IEnvConfig {
  NODE_ENV: string;
  GATEWAY_PORT: number;
  GATEWAY_HOST: string;
  AUTH_SERVICE_URL: string;
  USER_SERVICE_URL: string;
  PRODUCT_SERVICE_URL: string;
  ORDER_SERVICE_URL: string;
  AUTH_SERVICE_PORT: number;
  USER_SERVICE_PORT: number;
  PRODUCT_SERVICE_PORT: number;
  ORDER_SERVICE_PORT: number;
  MONGODB_URI: string;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  CORS_ORIGIN: string;
  FRONTEND_URL: string;
  BREVO_API_KEY: string;
  BREVO_PASSWORD: string;
  BREVO_SENDER_EMAIL: string;
  BREVO_SENDER_NAME: string;
  BREVO_USER: string;
}
