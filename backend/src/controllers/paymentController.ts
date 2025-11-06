import { Request, Response } from 'express';
import { getORM } from '../config/database';

export class PaymentController {
  static async createPayment(req: Request, res: Response) {
    try {
      const orm = getORM();
      const em = orm.em.fork();
      const newPayment = em.create('PaymentData', req.body);
      await em.persistAndFlush(newPayment);
      res.status(201).json(newPayment);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create payment' });
    }
  }

  static async getPayments(req: Request, res: Response) {
    try {
      const orm = getORM();
      const em = orm.em.fork();
      const payments = await em.find('PaymentData', {});
      res.json(payments);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}