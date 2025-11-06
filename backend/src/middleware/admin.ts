import { Request, Response, NextFunction } from 'express';
import { getORM } from '../config/database';
import { AuthenticatedRequest } from './auth';

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