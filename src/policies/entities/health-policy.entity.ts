import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { Policy } from './policy.entity';

export enum CoverageTier {
  BASIC = 'basic',
  STANDARD = 'standard',
  PREMIUM = 'premium',
}

@Entity('health_policies')
export class HealthPolicy {
  @PrimaryColumn({ name: 'policy_id' })
  policyId!: string;

  @OneToOne(() => Policy, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'policy_id' })
  policy!: Policy;

  @Column({ name: 'covered_employee_count' })
  coveredEmployeeCount!: number;

  @Column({ name: 'coverage_tier', type: 'enum', enum: CoverageTier })
  coverageTier!: CoverageTier;
}
