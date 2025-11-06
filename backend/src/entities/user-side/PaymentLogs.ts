import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity() // Generic entity; the table name is dynamic in your SQL
export class PaymentLog {

  @PrimaryKey()
  id!: number;

  @Property()
  invoice_id!: number;

  @Property()
  invoice_date!: Date;

  @Property({ length: 50 })
  status!: string;

  @Property({ type: 'timestamptz', defaultRaw: 'NOW()' })
  payment_date!: Date;

  @Property({ length: 100 })
  payment_type!: string;

  @Property()
  price!: number;

  @Property()
  amount!: number;

  @Property({ length: 255 })
  billing_adress!: string;

  @Property({ length: 20 })
  phone_number!: string;

  @Property({ type: 'jsonb', nullable: true })
  data_invoices?: object;
}
