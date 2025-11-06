import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity()
export class Stock {

  @PrimaryKey()
  id!: number;

  @Property()
  product_id!: number;

  @Property({ length: 100 })
  product_name!: string;

  @Property()
  amount!: number;

  @Property()
  purchased_date!: Date;

  @Property()
  expiry_date!: Date;
}
