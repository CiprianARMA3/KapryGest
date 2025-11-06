  import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity()
export class Customers {

  @PrimaryKey()
  id!: number;

  @Property({ length: 100 })
  name!: string;

  @Property({ length: 100 })
  surname!: string;

  @Property({ length: 255 })
  billing_address!: string;

  @Property({ length: 20 })
  phone_number!: string;
}