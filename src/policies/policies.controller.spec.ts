import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthModule } from '../auth/auth.module';
import { PolicyStatus } from './enums/policy-status.enum';
import { PolicyType } from './enums/policy-type.enum';
import { PoliciesController } from './policies.controller';
import { PoliciesService } from './policies.service';

const TEST_SECRET = 'test-secret';

const mockPolicy = {
  id: 'pol-1',
  policyNumber: 'POL-001',
  premium: 500,
  startDate: '2025-01-01',
  endDate: '2025-12-31',
  status: PolicyStatus.ACTIVE,
  type: PolicyType.HEALTH,
  details: { coveredEmployeeCount: 50, coverageTier: 'standard' },
};

describe('PoliciesController', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  const findAll = jest.fn();

  beforeEach(async () => {
    process.env.JWT_SECRET = TEST_SECRET;
    findAll.mockResolvedValue([mockPolicy]);

    const module = await Test.createTestingModule({
      imports: [AuthModule],
      controllers: [PoliciesController],
      providers: [{ provide: PoliciesService, useValue: { findAll } }],
    }).compile();

    app = module.createNestApplication();
    jwtService = module.get(JwtService);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    delete process.env.JWT_SECRET;
    jest.clearAllMocks();
  });

  const validToken = () =>
    jwtService.sign({ sub: 'agent-1', customers: ['cust-1'], policy_types: ['health'] });

  it('returns 401 when no Authorization header is present', () => {
    return request(app.getHttpServer()).get('/policies').expect(401);
  });

  it('returns 401 when token is invalid', () => {
    return request(app.getHttpServer())
      .get('/policies')
      .set('Authorization', 'Bearer not-valid')
      .expect(401);
  });

  it('returns 200 with policy list for valid JWT', async () => {
    const res = await request(app.getHttpServer())
      .get('/policies')
      .set('Authorization', `Bearer ${validToken()}`)
      .expect(200);

    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({
      id: 'pol-1',
      type: PolicyType.HEALTH,
      details: { coveredEmployeeCount: 50 },
    });
  });

  it('passes customer_id filter to service', async () => {
    await request(app.getHttpServer())
      .get('/policies?customer_id=cust-1')
      .set('Authorization', `Bearer ${validToken()}`)
      .expect(200);

    expect(findAll).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'cust-1' }),
    );
  });

  it('passes type filter to service', async () => {
    await request(app.getHttpServer())
      .get('/policies?type=health')
      .set('Authorization', `Bearer ${validToken()}`)
      .expect(200);

    expect(findAll).toHaveBeenCalledWith(
      expect.objectContaining({ type: PolicyType.HEALTH }),
    );
  });

  it('passes status filter to service', async () => {
    await request(app.getHttpServer())
      .get('/policies?status=active')
      .set('Authorization', `Bearer ${validToken()}`)
      .expect(200);

    expect(findAll).toHaveBeenCalledWith(
      expect.objectContaining({ status: PolicyStatus.ACTIVE }),
    );
  });
});
