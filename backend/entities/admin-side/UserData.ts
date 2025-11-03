import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity({ tableName: 'user_data' })
export class UserData {
  @PrimaryKey()
  id!: number;

  @Property({ unique: true, length: 100 })
  username!: string;

  @Property({ unique: true, length: 255 })
  email!: string;

  @Property({ length: 255 })
  password!: string;

  @Property({ type: 'date' })
  birthdate!: Date;

  @Property({ nullable: true, length: 1 })
  active_subscription?: string;

  @Property({ type: 'boolean', default: false })
  expired: boolean = false;

  @Property({ length: 100 })
  name!: string;

  @Property({ length: 100 })
  surname!: string;

  @Property({ length: 11 })
  phone_number!: string;

  @Property({ type: 'boolean', default: false })
  suspended: boolean = false;

  @Property({ type: 'date', onCreate: () => new Date() })
  created_at?: Date = new Date(); // optional for TypeScript

  // @Property({ type: 'date', nullable: true, onUpdate: () => new Date() })
  // updated_at?: Date;

  @Property({ type: 'date', nullable: true })
  last_login?: Date;

  @Property({ default: false })
  admin!: boolean; 
}
