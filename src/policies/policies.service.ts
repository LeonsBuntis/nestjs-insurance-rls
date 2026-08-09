import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, FindOptionsWhere, Repository } from 'typeorm';
import { AutoPolicy } from './entities/auto-policy.entity';
import { HealthPolicy } from './entities/health-policy.entity';
import { PropertyPolicy } from './entities/property-policy.entity';
import { Policy } from './entities/policy.entity';
import { PolicyStatus } from './enums/policy-status.enum';
import { PolicyType } from './enums/policy-type.enum';

export interface PolicyFilters {
  customerId?: string;
  type?: PolicyType;
  status?: PolicyStatus;
}

@Injectable()
export class PoliciesService {
  constructor(
    @InjectRepository(HealthPolicy)
    private readonly healthRepo: Repository<HealthPolicy>,
    @InjectRepository(PropertyPolicy)
    private readonly propertyRepo: Repository<PropertyPolicy>,
    @InjectRepository(AutoPolicy)
    private readonly autoRepo: Repository<AutoPolicy>,
  ) {}

  async findAll(filters: PolicyFilters, em?: EntityManager) {
    const healthRepo = em ? em.getRepository(HealthPolicy) : this.healthRepo;
    const propertyRepo = em ? em.getRepository(PropertyPolicy) : this.propertyRepo;
    const autoRepo = em ? em.getRepository(AutoPolicy) : this.autoRepo;

    const policyWhere: FindOptionsWhere<Policy> = {};
    if (filters.customerId) policyWhere.customerId = filters.customerId;
    if (filters.status) policyWhere.status = filters.status;

    const results: ReturnType<typeof this.mapHealth | typeof this.mapProperty | typeof this.mapAuto>[] = [];

    if (!filters.type || filters.type === PolicyType.HEALTH) {
      const rows = await healthRepo.find({ where: { policy: policyWhere }, relations: { policy: true } });
      results.push(...rows.map((h) => this.mapHealth(h)));
    }

    if (!filters.type || filters.type === PolicyType.PROPERTY) {
      const rows = await propertyRepo.find({ where: { policy: policyWhere }, relations: { policy: true } });
      results.push(...rows.map((p) => this.mapProperty(p)));
    }

    if (!filters.type || filters.type === PolicyType.AUTO) {
      const rows = await autoRepo.find({ where: { policy: policyWhere }, relations: { policy: true } });
      results.push(...rows.map((a) => this.mapAuto(a)));
    }

    return results;
  }

  private mapHealth(h: HealthPolicy) {
    return {
      ...this.baseFields(h.policy),
      type: PolicyType.HEALTH,
      details: {
        coveredEmployeeCount: h.coveredEmployeeCount,
        coverageTier: h.coverageTier,
      },
    };
  }

  private mapProperty(p: PropertyPolicy) {
    return {
      ...this.baseFields(p.policy),
      type: PolicyType.PROPERTY,
      details: {
        propertyAddress: p.propertyAddress,
        insuredValue: Number(p.insuredValue),
        propertyType: p.propertyType,
      },
    };
  }

  private mapAuto(a: AutoPolicy) {
    return {
      ...this.baseFields(a.policy),
      type: PolicyType.AUTO,
      details: {
        insuredVehicleCount: a.insuredVehicleCount,
        vehicleCategory: a.vehicleCategory,
      },
    };
  }

  private baseFields(policy: Policy) {
    return {
      id: policy.id,
      policyNumber: policy.policyNumber,
      premium: Number(policy.premium),
      startDate: policy.startDate,
      endDate: policy.endDate,
      status: policy.status,
    };
  }
}
