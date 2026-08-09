import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
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

describe('PoliciesService', () => {
  let service: PoliciesService;
  const healthFind = jest.fn();
  const propertyFind = jest.fn();
  const autoFind = jest.fn();

  beforeEach(async () => {
    healthFind.mockResolvedValue([]);
    propertyFind.mockResolvedValue([]);
    autoFind.mockResolvedValue([]);

    const module = await Test.createTestingModule({
      providers: [
        PoliciesService,
        { provide: getRepositoryToken(HealthPolicy), useValue: { find: healthFind } },
        { provide: getRepositoryToken(PropertyPolicy), useValue: { find: propertyFind } },
        { provide: getRepositoryToken(AutoPolicy), useValue: { find: autoFind } },
      ],
    }).compile();

    service = module.get(PoliciesService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll() with no filters', () => {
    it('queries all three policy tables', async () => {
      await service.findAll({});
      expect(healthFind).toHaveBeenCalledTimes(1);
      expect(propertyFind).toHaveBeenCalledTimes(1);
      expect(autoFind).toHaveBeenCalledTimes(1);
    });

    it('maps health policy to discriminated union with details', async () => {
      healthFind.mockResolvedValue([healthRow()]);
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
      propertyFind.mockResolvedValue([propertyRow()]);
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
      autoFind.mockResolvedValue([autoRow()]);
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
      expect(healthFind).toHaveBeenCalledTimes(1);
      expect(propertyFind).not.toHaveBeenCalled();
      expect(autoFind).not.toHaveBeenCalled();
    });

    it('only queries property table when type=property', async () => {
      await service.findAll({ type: PolicyType.PROPERTY });
      expect(healthFind).not.toHaveBeenCalled();
      expect(propertyFind).toHaveBeenCalledTimes(1);
      expect(autoFind).not.toHaveBeenCalled();
    });

    it('only queries auto table when type=auto', async () => {
      await service.findAll({ type: PolicyType.AUTO });
      expect(healthFind).not.toHaveBeenCalled();
      expect(propertyFind).not.toHaveBeenCalled();
      expect(autoFind).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll() with customer_id filter', () => {
    it('passes customer_id into the policy where clause', async () => {
      await service.findAll({ customerId: 'cust-1' });
      expect(healthFind).toHaveBeenCalledWith(
        expect.objectContaining({ where: { policy: expect.objectContaining({ customerId: 'cust-1' }) } }),
      );
    });
  });

  describe('findAll() with status filter', () => {
    it('passes status into the policy where clause', async () => {
      await service.findAll({ status: PolicyStatus.ACTIVE });
      expect(healthFind).toHaveBeenCalledWith(
        expect.objectContaining({ where: { policy: expect.objectContaining({ status: PolicyStatus.ACTIVE }) } }),
      );
    });
  });
});
