/* eslint-disable prettier/prettier */
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number; 
  
  @Column()
  username!: string;

  @Column()
  password!: string;

  @Column()
  email!: string;

  @Column()
  user_type!: string;

  @Column()
  first_name!: string;

  @Column()
  last_name!: string;

  @Column()
  role!: string;

  @Column({ unique: true, nullable: true })
  school_id!: string;

  @Column({ type: "longtext", nullable: true })
  profileImage!: string;

}
