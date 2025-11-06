import { EntitySchema } from '@mikro-orm/core';

export interface IPaymentData {
  id: number;
  name: string;
  surname: string;
  purchase_date: Date;
  payment_type: string;
  billing_address: string;
  phone_number: string;
}

export class PaymentData implements IPaymentData {
  id!: number;
  name!: string;
  surname!: string;
  purchase_date!: Date;
  payment_type!: string;
  billing_address!: string;
  phone_number!: string;
}

export const PaymentDataSchema = new EntitySchema<PaymentData>({
  class: PaymentData,
  tableName: 'payment_data',
  properties: {
    id: { type: 'number', primary: true },
    name: { type: 'string', length: 100 },
    surname: { type: 'string', length: 100 },
    purchase_date: { type: 'Date' },
    payment_type: { type: 'string', length: 50 },
    billing_address: { type: 'string', length: 200 },
    phone_number: { type: 'string', length: 11 },
  },
});
