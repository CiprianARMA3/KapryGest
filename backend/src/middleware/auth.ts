import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_CONFIG } from '../config/auth';
import { getORM } from '../config/database';

export interface AuthenticatedRequest extends Request {
  user?: { id: number; email: string };
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const token = req.cookies.token || req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied, token missing' });

  jwt.verify(token, JWT_CONFIG.secret, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

export const checkSuspended = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const orm = getORM();
    const em = orm.em.fork();
    const user = await em.findOne('UserData', { id: req.user?.id });
    if (user && (user as any).suspended) {
      return res.status(403).json({ error: 'Account suspended. Please contact administrator.' });
    }
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error checking account status' });
  }
};

export const isAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const orm = getORM();
    const em = orm.em.fork();
    const user = await em.findOne('UserData', { id: req.user?.id });
    if (!user || !(user as any).admin) return res.status(403).json({ error: 'Permission denied' });
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error verifying admin' });
  }
};