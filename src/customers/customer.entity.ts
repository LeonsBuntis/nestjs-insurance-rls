import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Policy } from '../policies/entities/policy.entity';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ name: 'registration_number', unique: true })
  registrationNumber!: string;

  @Column()
  country!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @OneToMany(() => Policy, (policy) => policy.customer)
  policies!: Policy[];
}
