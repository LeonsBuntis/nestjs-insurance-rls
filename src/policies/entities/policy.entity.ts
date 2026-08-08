import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Customer } from '../../customers/customer.entity';
import { PolicyStatus } from '../enums/policy-status.enum';
import { PolicyType } from '../enums/policy-type.enum';

@Entity('policies')
export class Policy {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'customer_id' })
  customerId!: string;

  @ManyToOne(() => Customer, (customer) => customer.policies)
  @JoinColumn({ name: 'customer_id' })
  customer!: Customer;

  @Column({ type: 'enum', enum: PolicyType })
  type!: PolicyType;

  @Column({ name: 'policy_number', unique: true })
  policyNumber!: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  premium!: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate!: string;

  @Column({ name: 'end_date', type: 'date' })
  endDate!: string;

  @Column({ type: 'enum', enum: PolicyStatus })
  status!: PolicyStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
