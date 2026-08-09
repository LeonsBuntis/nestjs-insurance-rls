import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { PoliciesService } from './policies.service';
import { AutoPolicy, VehicleCategory } from './entities/auto-policy.entity';
import { CoverageTier, HealthPolicy } from './entities/health-policy.entity';
import { PropertyPolicy, PropertyType } from './entities/property-policy.entity';
import { PolicyStatus } from './enums/policy-status.enum';
import { PolicyType } from './enums/policy-type.enum';

const basePolicy = (overrides: Partial<{
  id: string; policyNumber: string; customerId: string; status: PolicyStatus; type: PolicyType;
}> = {}) => ({
  id: overrides.id ?? 'pol-1',
  policyNumber: overrides.policyNumber ?? 'POL-001',
  premium: '500.00',
  startDate: '2025-01-01',
  endDate: '2025-12-31',
  status: overrides.status ?? PolicyStatus.ACTIVE,
  customerId: overrides.customerId ?? 'cust-1',
  type: overrides.type ?? PolicyType.HEALTH,
  createdAt: new Date('2025-01-01'),
});

const healthRow = (policyOverrides = {}): HealthPolicy =>
  ({
    policyId: 'hp-1',
    coveredEmployeeCount: 50,
    coverageTier: CoverageTier.STANDARD,
    policy: basePolicy({ type: PolicyType.HEALTH, ...policyOverrides }),
  }) as HealthPolicy;

const propertyRow = (policyOverrides = {}): PropertyPolicy =>
  ({
    policyId: 'pp-1',
    propertyAddress: '123 Main St',
    insuredValue: '1000000.00',
    propertyType: PropertyType.OFFICE,
    policy: basePolicy({ id: 'pol-2', policyNumber: 'POL-002', type: PolicyType.PROPERTY, ...policyOverrides }),
  }) as PropertyPolicy;

const autoRow = (policyOverrides = {}): AutoPolicy =>
  ({
    policyId: 'ap-1',
    insuredVehicleCount: 10,
    vehicleCategory: VehicleCategory.CARS,
    policy: basePolicy({ id: 'pol-3', policyNumber: 'POL-003', type: PolicyType.AUTO, ...policyOverrides }),
  }) as AutoPolicy;

const makeQb = (data: unknown[]) => {
  const qb: { innerJoinAndSelect: jest.Mock; andWhere: jest.Mock; getMany: jest.Mock } = {
    innerJoinAndSelect: jest.fn(),
    andWhere: jest.fn(),
    getMany: jest.fn().mockResolvedValue(data),
  };
  qb.innerJoinAndSelect.mockReturnValue(qb);
  qb.andWhere.mockReturnValue(qb);
  return qb;
};

describe('PoliciesService', () => {
  let service: PoliciesService;
  let healthQb: ReturnType<typeof makeQb>;
  let propertyQb: ReturnType<typeof makeQb>;
  let autoQb: ReturnType<typeof makeQb>;
  let createQueryBuilder: jest.Mock;

  beforeEach(async () => {
    healthQb = makeQb([]);
    propertyQb = makeQb([]);
    autoQb = makeQb([]);

    createQueryBuilder = jest.fn((entity: Function) => {
      if (entity === HealthPolicy) return healthQb;
      if (entity === PropertyPolicy) return propertyQb;
      if (entity === AutoPolicy) return autoQb;
    });

    const mockManager = { createQueryBuilder };

    const module = await Test.createTestingModule({
      providers: [
        PoliciesService,
        { provide: getRepositoryToken(HealthPolicy), useValue: { manager: mockManager } },
        { provide: getRepositoryToken(PropertyPolicy), useValue: { manager: mockManager } },
        { provide: getRepositoryToken(AutoPolicy), useValue: { manager: mockManager } },
      ],
    }).compile();

    service = module.get(PoliciesService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll() with no filters', () => {
    it('queries all three policy tables', async () => {
      await service.findAll({});
      expect(createQueryBuilder).toHaveBeenCalledWith(HealthPolicy, 'hp');
      expect(createQueryBuilder).toHaveBeenCalledWith(PropertyPolicy, 'pp');
      expect(createQueryBuilder).toHaveBeenCalledWith(AutoPolicy, 'ap');
    });

    it('maps health policy to discriminated union with details', async () => {
      healthQb.getMany.mockResolvedValue([healthRow()]);
      const result = await service.findAll({});
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'pol-1',
        policyNumber: 'POL-001',
        premium: 500,
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        status: PolicyStatus.ACTIVE,
        type: PolicyType.HEALTH,
        details: { coveredEmployeeCount: 50, coverageTier: CoverageTier.STANDARD },
      });
    });

    it('maps property policy to discriminated union with details', async () => {
      propertyQb.getMany.mockResolvedValue([propertyRow()]);
      const result = await service.findAll({});
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'pol-2',
        policyNumber: 'POL-002',
        premium: 500,
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        status: PolicyStatus.ACTIVE,
        type: PolicyType.PROPERTY,
        details: {
          propertyAddress: '123 Main St',
          insuredValue: 1000000,
          propertyType: PropertyType.OFFICE,
        },
      });
    });

    it('maps auto policy to discriminated union with details', async () => {
      autoQb.getMany.mockResolvedValue([autoRow()]);
      const result = await service.findAll({});
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'pol-3',
        policyNumber: 'POL-003',
        premium: 500,
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        status: PolicyStatus.ACTIVE,
        type: PolicyType.AUTO,
        details: { insuredVehicleCount: 10, vehicleCategory: VehicleCategory.CARS },
      });
    });
  });

  describe('findAll() with type filter', () => {
    it('only queries health table when type=health', async () => {
      await service.findAll({ type: PolicyType.HEALTH });
      expect(createQueryBuilder).toHaveBeenCalledWith(HealthPolicy, 'hp');
      expect(createQueryBuilder).not.toHaveBeenCalledWith(PropertyPolicy, expect.any(String));
      expect(createQueryBuilder).not.toHaveBeenCalledWith(AutoPolicy, expect.any(String));
    });

    it('only queries property table when type=property', async () => {
      await service.findAll({ type: PolicyType.PROPERTY });
      expect(createQueryBuilder).not.toHaveBeenCalledWith(HealthPolicy, expect.any(String));
      expect(createQueryBuilder).toHaveBeenCalledWith(PropertyPolicy, 'pp');
      expect(createQueryBuilder).not.toHaveBeenCalledWith(AutoPolicy, expect.any(String));
    });

    it('only queries auto table when type=auto', async () => {
      await service.findAll({ type: PolicyType.AUTO });
      expect(createQueryBuilder).not.toHaveBeenCalledWith(HealthPolicy, expect.any(String));
      expect(createQueryBuilder).not.toHaveBeenCalledWith(PropertyPolicy, expect.any(String));
      expect(createQueryBuilder).toHaveBeenCalledWith(AutoPolicy, 'ap');
    });
  });

  describe('findAll() with customer_id filter', () => {
    it('applies customer_id as an andWhere condition on the policy join', async () => {
      await service.findAll({ customerId: 'cust-1' });
      expect(healthQb.andWhere).toHaveBeenCalledWith('p.customerId = :cid', { cid: 'cust-1' });
      expect(propertyQb.andWhere).toHaveBeenCalledWith('p.customerId = :cid', { cid: 'cust-1' });
      expect(autoQb.andWhere).toHaveBeenCalledWith('p.customerId = :cid', { cid: 'cust-1' });
    });
  });

  describe('findAll() with status filter', () => {
    it('applies status as an andWhere condition on the policy join', async () => {
      await service.findAll({ status: PolicyStatus.ACTIVE });
      expect(healthQb.andWhere).toHaveBeenCalledWith('p.status = :status', { status: PolicyStatus.ACTIVE });
      expect(propertyQb.andWhere).toHaveBeenCalledWith('p.status = :status', { status: PolicyStatus.ACTIVE });
      expect(autoQb.andWhere).toHaveBeenCalledWith('p.status = :status', { status: PolicyStatus.ACTIVE });
    });
  });

  describe('findAll() with EntityManager', () => {
    it('uses the provided EntityManager instead of the repo manager', async () => {
      const emHealthQb = makeQb([healthRow()]);
      const emCreateQb = jest.fn((entity: Function) => {
        if (entity === HealthPolicy) return emHealthQb;
        if (entity === PropertyPolicy) return makeQb([]);
        if (entity === AutoPolicy) return makeQb([]);
      });
      const mockEm = { createQueryBuilder: emCreateQb } as unknown as EntityManager;

      const result = await service.findAll({}, mockEm);

      expect(emCreateQb).toHaveBeenCalled();
      expect(createQueryBuilder).not.toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });
});

