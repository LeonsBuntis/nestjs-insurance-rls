import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { Policy } from './policy.entity';

export enum PropertyType {
  OFFICE = 'office',
  WAREHOUSE = 'warehouse',
  RETAIL = 'retail',
}

@Entity('property_policies')
export class PropertyPolicy {
  @PrimaryColumn({ name: 'policy_id' })
  policyId!: string;

  @OneToOne(() => Policy, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'policy_id' })
  policy!: Policy;

  @Column({ name: 'property_address' })
  propertyAddress!: string;

  @Column({ name: 'insured_value', type: 'numeric', precision: 15, scale: 2 })
  insuredValue!: string;

  @Column({ name: 'property_type', type: 'enum', enum: PropertyType })
  propertyType!: PropertyType;
}
