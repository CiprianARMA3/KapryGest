import { EntitySchema } from '@mikro-orm/core';

export interface ISubscriptionData {
  id: number;
  payment_date: Date;
  expiry_date: Date;
}

export class SubscriptionData implements ISubscriptionData {
  id!: number;
  payment_date!: Date;
  expiry_date!: Date;
}

export const SubscriptionDataSchema = new EntitySchema<SubscriptionData>({
  class: SubscriptionData,
  tableName: 'subscription_data',
  properties: {
    id: { type: 'number', primary: true },
    payment_date: { type: 'Date' },
    expiry_date: { type: 'Date' },
  },
});
