import jwt from 'jsonwebtoken';

export interface TokenPayload {
  id: string;
  email: string;
  role: 'user' | 'staff' | 'admin' | 'owner' | 'manager';
  isAdmin?: boolean;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  const secret = process.env.JWT_SECRET || 'fallback-secret';
  const expiresIn = process.env.JWT_EXPIRY || '1h';
  
  return jwt.sign(payload, secret, { expiresIn });
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  const secret = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret';
  const expiresIn = process.env.JWT_REFRESH_EXPIRY || '7d';
  
  return jwt.sign(payload, secret, { expiresIn });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  const secret = process.env.JWT_SECRET || 'fallback-secret';
  return jwt.verify(token, secret) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  const secret = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret';
  return jwt.verify(token, secret) as TokenPayload;
};

export const getTokenExpiry = (token: string): Date | null => {
  try {
    const decoded = jwt.decode(token) as any;
    return decoded ? new Date(decoded.exp * 1000) : null;
  } catch {
    return null;
  }
};
