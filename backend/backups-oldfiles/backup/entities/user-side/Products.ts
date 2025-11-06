import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity() // Generic entity; dynamic table names handled via raw SQL
export class Product {

  @PrimaryKey()
  id!: number;

  @Property({ length: 100 })
  name!: string;

  @Property({ length: 50 })
  category!: string;

  @Property()
  price!: number;

  @Property()
  reduced_percentage!: number;

  @Property({ type: 'text' })
  description!: string;

  @Property({ type: 'jsonb', nullable: true })
  data?: object;
}
