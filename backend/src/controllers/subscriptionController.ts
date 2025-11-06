import { Request, Response } from 'express';
import { getORM } from '../config/database';

export class SubscriptionController {
  static async createSubscription(req: Request, res: Response) {
    try {
      const orm = getORM();
      const em = orm.em.fork();
      const newSub = em.create('SubscriptionData', req.body);
      await em.persistAndFlush(newSub);
      res.status(201).json(newSub);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create subscription' });
    }
  }

  static async getSubscriptions(req: Request, res: Response) {
    try {
      const orm = getORM();
      const em = orm.em.fork();
      const subs = await em.find('SubscriptionData', {});
      res.json(subs);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}