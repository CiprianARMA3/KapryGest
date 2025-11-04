import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity() // Generic entity; dynamic table names handled via raw SQL
export class Order {

  @PrimaryKey()
  id!: number;

  @Property()
  product_id!: number;

  @Property()
  quantity!: number;

  @Property()
  TVA!: number;

  @Property()
  total!: number;

  @Property({ length: 50 })
  status!: string;

  @Property({ type: 'timestamptz', defaultRaw: 'NOW()' })
  created_at!: Date;

  @Property({ type: 'jsonb', nullable: true })
  data_invoices?: object;
}
