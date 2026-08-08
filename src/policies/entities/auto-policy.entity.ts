import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { Policy } from './policy.entity';

export enum VehicleCategory {
  CARS = 'cars',
  TRUCKS = 'trucks',
  MIXED = 'mixed',
}

@Entity('auto_policies')
export class AutoPolicy {
  @PrimaryColumn({ name: 'policy_id' })
  policyId!: string;

  @OneToOne(() => Policy, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'policy_id' })
  policy!: Policy;

  @Column({ name: 'insured_vehicle_count' })
  insuredVehicleCount!: number;

  @Column({ name: 'vehicle_category', type: 'enum', enum: VehicleCategory })
  vehicleCategory!: VehicleCategory;
}
