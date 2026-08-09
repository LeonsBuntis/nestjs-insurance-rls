import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
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
    // Use the provided EntityManager (transaction-scoped) so all queries run on
    // the same connection where SET LOCAL was issued. Fallback to the repo's
    // own manager for unauthenticated / non-RLS callers.
    const manager = em ?? this.healthRepo.manager;

    const results: ReturnType<typeof this.mapHealth | typeof this.mapProperty | typeof this.mapAuto>[] = [];

    if (!filters.type || filters.type === PolicyType.HEALTH) {
      const qb = manager
        .createQueryBuilder(HealthPolicy, 'hp')
        .innerJoinAndSelect('hp.policy', 'p');
      if (filters.customerId) qb.andWhere('p.customerId = :cid', { cid: filters.customerId });
      if (filters.status) qb.andWhere('p.status = :status', { status: filters.status });
      results.push(...(await qb.getMany()).map((h) => this.mapHealth(h)));
    }

    if (!filters.type || filters.type === PolicyType.PROPERTY) {
      const qb = manager
        .createQueryBuilder(PropertyPolicy, 'pp')
        .innerJoinAndSelect('pp.policy', 'p');
      if (filters.customerId) qb.andWhere('p.customerId = :cid', { cid: filters.customerId });
      if (filters.status) qb.andWhere('p.status = :status', { status: filters.status });
      results.push(...(await qb.getMany()).map((p) => this.mapProperty(p)));
    }

    if (!filters.type || filters.type === PolicyType.AUTO) {
      const qb = manager
        .createQueryBuilder(AutoPolicy, 'ap')
        .innerJoinAndSelect('ap.policy', 'p');
      if (filters.customerId) qb.andWhere('p.customerId = :cid', { cid: filters.customerId });
      if (filters.status) qb.andWhere('p.status = :status', { status: filters.status });
      results.push(...(await qb.getMany()).map((a) => this.mapAuto(a)));
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
