import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Response } from 'express';
import { JWT_CONFIG, BCRYPT_ROUNDS } from '../config/auth';

export interface TokenPayload {
  id: number;
  email: string;
}

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, BCRYPT_ROUNDS);
  }

  static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  static generateToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_CONFIG.secret, { expiresIn: JWT_CONFIG.expiry } as jwt.SignOptions);
  }

  static setTokenCookie(res: Response, token: string): void {
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax',
    });
  }
}