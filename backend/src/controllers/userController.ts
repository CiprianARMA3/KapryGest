import { Request, Response } from 'express';
import { getORM } from '../config/database';

export class UserController {
  static async getAllUsers(req: Request, res: Response) {
    try {
      const orm = getORM();
      const em = orm.em.fork();
      const users = await em.find('UserData', {});
      res.json(users);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}