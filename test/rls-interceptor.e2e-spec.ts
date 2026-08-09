import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Client } from 'pg';
import request from 'supertest';
import { AppModule } from '../src/app.module';

const DB = {
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432'),
  database: process.env.DB_NAME ?? 'insurance',
};

describe('RLS: GET /policies interceptor end-to-end', () => {
  let app: INestApplication;
  let superuser: Client;
  let customerAId: string;
  let customerBId: string;

  const issueToken = (customers: string[], policy_types: string[]) =>
    request(app.getHttpServer())
      .post('/auth/token')
      .send({ sub: 'interceptor-test', customers, policy_types })
      .then((res) => res.body.access_token as string);

  const getPolicies = (token: string) =>
    request(app.getHttpServer())
      .get('/policies')
      .set('Authorization', `Bearer ${token}`);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();

    superuser = new Client({
      ...DB,
      user: process.env.DB_USER ?? 'postgres',
      password: process.env.DB_PASSWORD ?? 'postgres',
    });
    await superuser.connect();

    // Customer A: health + property policies.
    const {
      rows: [a],
    } = await superuser.query(
      `INSERT INTO customers (id, name, registration_number, country)
       VALUES (gen_random_uuid(), 'RLS Int A', 'RLS-INT-A', 'NL') RETURNING id`,
    );
    customerAId = a.id;

    const {
      rows: [polAH],
    } = await superuser.query(
      `INSERT INTO policies (id, customer_id, type, policy_number, premium, start_date, end_date, status)
       VALUES (gen_random_uuid(), $1, 'health', 'RLS-INT-A-HEALTH', 100, CURRENT_DATE, CURRENT_DATE + 365, 'active')
       RETURNING id`,
      [customerAId],
    );
    await superuser.query(
      `INSERT INTO health_policies (policy_id, covered_employee_count, coverage_tier)
       VALUES ($1, 10, 'standard')`,
      [polAH.id],
    );

    const {
      rows: [polAP],
    } = await superuser.query(
      `INSERT INTO policies (id, customer_id, type, policy_number, premium, start_date, end_date, status)
       VALUES (gen_random_uuid(), $1, 'property', 'RLS-INT-A-PROP', 200, CURRENT_DATE, CURRENT_DATE + 365, 'active')
       RETURNING id`,
      [customerAId],
    );
    await superuser.query(
      `INSERT INTO property_policies (policy_id, property_address, insured_value, property_type)
       VALUES ($1, '1 Main St', 500000, 'office')`,
      [polAP.id],
    );

    // Customer B: auto policy.
    const {
      rows: [b],
    } = await superuser.query(
      `INSERT INTO customers (id, name, registration_number, country)
       VALUES (gen_random_uuid(), 'RLS Int B', 'RLS-INT-B', 'NL') RETURNING id`,
    );
    customerBId = b.id;

    const {
      rows: [polBA],
    } = await superuser.query(
      `INSERT INTO policies (id, customer_id, type, policy_number, premium, start_date, end_date, status)
       VALUES (gen_random_uuid(), $1, 'auto', 'RLS-INT-B-AUTO', 300, CURRENT_DATE, CURRENT_DATE + 365, 'active')
       RETURNING id`,
      [customerBId],
    );
    await superuser.query(
      `INSERT INTO auto_policies (policy_id, insured_vehicle_count, vehicle_category)
       VALUES ($1, 5, 'cars')`,
      [polBA.id],
    );
  });

  afterAll(async () => {
    await superuser.query(
      `DELETE FROM policies WHERE policy_number IN ('RLS-INT-A-HEALTH', 'RLS-INT-A-PROP', 'RLS-INT-B-AUTO')`,
    );
    await superuser.query(
      `DELETE FROM customers WHERE registration_number IN ('RLS-INT-A', 'RLS-INT-B')`,
    );
    await superuser.end();
    await app.close();
  });

  it('customer isolation: token scoped to customer A cannot see customer B policies', async () => {
    const token = await issueToken([customerAId], ['health', 'property', 'auto']);
    const { body } = await getPolicies(token).expect(200);

    const nums = (body as { policyNumber: string }[]).map((p) => p.policyNumber);
    expect(nums).toContain('RLS-INT-A-HEALTH');
    expect(nums).toContain('RLS-INT-A-PROP');
    expect(nums).not.toContain('RLS-INT-B-AUTO');
  });

  it('type filter: token scoped to health cannot see property or auto policies', async () => {
    const token = await issueToken([customerAId, customerBId], ['health']);
    const { body } = await getPolicies(token).expect(200);

    const nums = (body as { policyNumber: string }[]).map((p) => p.policyNumber);
    expect(nums).toContain('RLS-INT-A-HEALTH');
    expect(nums).not.toContain('RLS-INT-A-PROP');
    expect(nums).not.toContain('RLS-INT-B-AUTO');
  });

  it('fail-safe: token with empty customers returns empty list', async () => {
    const token = await issueToken([], ['health', 'property', 'auto']);
    const { body } = await getPolicies(token).expect(200);

    expect(body).toEqual([]);
  });
});
