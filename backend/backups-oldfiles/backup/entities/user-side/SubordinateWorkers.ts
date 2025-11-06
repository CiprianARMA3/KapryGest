import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity()
export class SubordinateWorkers {

  @PrimaryKey()
  id!: number;
    
  @Property({length:100})
  name!:string ;

  @Property({length:100})
  surname!:string ;

    @Property({length:256})
    email!:string ;

  @Property()
  phone_number!: number;

  @Property({ length: 100 })
  role!: string;

    @Property({ length: 256 })
  password!: string;


  @Property({ type: 'jsonb', nullable: true })
  permissions?: object;
  
  @Property({ type: 'jsonb', nullable: true })
  logs?: object;

  @Property()
  created_at!: Date;
  
}
