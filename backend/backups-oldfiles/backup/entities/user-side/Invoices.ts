import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity() // generic entity; dynamic tables handled via raw SQL
export class Invoice {

  @PrimaryKey()
  id!: number;

  @Property()
  order_id!: number;

  @Property()
  date!: Date;

  @Property({ type: 'jsonb', nullable: true })
  data_invoices?: object;
}
