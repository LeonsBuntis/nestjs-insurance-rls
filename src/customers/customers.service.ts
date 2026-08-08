import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './customer.entity';
import { AutoPolicy } from '../policies/entities/auto-policy.entity';
import { HealthPolicy } from '../policies/entities/health-policy.entity';
import { PropertyPolicy } from '../policies/entities/property-policy.entity';
import { Policy } from '../policies/entities/policy.entity';
import { PolicyStatus } from '../policies/enums/policy-status.enum';
import { PolicyType } from '../policies/enums/policy-type.enum';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    @InjectRepository(HealthPolicy)
    private readonly healthPolicyRepo: Repository<HealthPolicy>,
    @InjectRepository(PropertyPolicy)
    private readonly propertyPolicyRepo: Repository<PropertyPolicy>,
    @InjectRepository(AutoPolicy)
    private readonly autoPolicyRepo: Repository<AutoPolicy>,
  ) {}

  async findPolicies(customerId: string, status?: PolicyStatus) {
    const exists = await this.customerRepo.existsBy({ id: customerId });
    if (!exists) throw new NotFoundException(`Customer ${customerId} not found`);

    const policyWhere = status
      ? { policy: { customerId, status } }
      : { policy: { customerId } };

    const [health, property, auto] = await Promise.all([
      this.healthPolicyRepo.find({ where: policyWhere, relations: { policy: true } }),
      this.propertyPolicyRepo.find({ where: policyWhere, relations: { policy: true } }),
      this.autoPolicyRepo.find({ where: policyWhere, relations: { policy: true } }),
    ]);

    return [
      ...health.map((h) => ({
        ...this.baseFields(h.policy),
        type: PolicyType.HEALTH,
        coveredEmployeeCount: h.coveredEmployeeCount,
        coverageTier: h.coverageTier,
      })),
      ...property.map((p) => ({
        ...this.baseFields(p.policy),
        type: PolicyType.PROPERTY,
        propertyAddress: p.propertyAddress,
        insuredValue: Number(p.insuredValue),
        propertyType: p.propertyType,
      })),
      ...auto.map((a) => ({
        ...this.baseFields(a.policy),
        type: PolicyType.AUTO,
        insuredVehicleCount: a.insuredVehicleCount,
        vehicleCategory: a.vehicleCategory,
      })),
    ];
  }

  private baseFields(policy: Policy) {
    return {
      id: policy.id,
      policyNumber: policy.policyNumber,
      premium: Number(policy.premium),
      startDate: policy.startDate,
      endDate: policy.endDate,
      status: policy.status,
      createdAt: policy.createdAt,
    };
  }
}
