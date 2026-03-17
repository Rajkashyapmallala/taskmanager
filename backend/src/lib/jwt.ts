import jwt from 'jsonwebtoken';

export interface AccessTokenPayload {
  userId: string;
  email: string;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
}

export function generateAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET as string, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  } as jwt.SignOptions);
}

export function generateRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET as string, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET as string) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET as string) as RefreshTokenPayload;
}

export function getRefreshTokenExpiry(): Date {
  const days = parseInt((process.env.JWT_REFRESH_EXPIRES_IN || '7d').replace('d', ''));
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + days);
  return expiry;
}
