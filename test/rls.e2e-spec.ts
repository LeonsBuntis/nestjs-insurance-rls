import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Client, Pool } from 'pg';
import { AppModule } from '../src/app.module';

const DB = {
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432'),
  database: process.env.DB_NAME ?? 'insurance',
};

describe('RLS: principal_scope policy on policies table', () => {
  let app: INestApplication;
  let superuser: Client;
  let appUser: Pool;
  let customerId: string;

  beforeAll(async () => {
    // Boot the app — RlsSetupService.onModuleInit() enables RLS and installs policies.
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();

    // Superuser connection for seeding (superusers bypass RLS).
    superuser = new Client({
      ...DB,
      user: process.env.DB_USER ?? 'postgres',
      password: process.env.DB_PASSWORD ?? 'postgres',
    });
    await superuser.connect();

    // Seed an isolated test customer + health policy via superuser.
    const { rows: [cust] } = await superuser.query(`
      INSERT INTO customers (id, name, registration_number, country)
      VALUES (gen_random_uuid(), 'RLS Test Corp', 'RLS-TEST-9999', 'NL')
      RETURNING id
    `);
    customerId = cust.id;

    await superuser.query(
      `INSERT INTO policies
         (id, customer_id, type, policy_number, premium, start_date, end_date, status)
       VALUES
         (gen_random_uuid(), $1, 'health', 'RLS-TEST-POL-001',
          100.00, CURRENT_DATE, CURRENT_DATE + 365, 'active')`,
      [customerId],
    );

    // Non-superuser pool for all RLS-gated queries.
    appUser = new Pool({
      ...DB,
      user: process.env.APP_DB_USER ?? 'app_user',
      password: process.env.APP_DB_PASSWORD ?? 'app_password',
    });
  });

  afterAll(async () => {
    await superuser.query(`DELETE FROM policies WHERE policy_number = 'RLS-TEST-POL-001'`);
    await superuser.query(`DELETE FROM customers WHERE registration_number = 'RLS-TEST-9999'`);
    await superuser.end();
    await appUser.end();
    await app.close();
  });

  it('returns zero rows when session variables are absent (fail-safe)', async () => {
    const { rows } = await appUser.query('SELECT id FROM policies');
    expect(rows).toHaveLength(0);
  });

  it('returns only the scoped row when session variables match', async () => {
    const client = await appUser.connect();
    try {
      await client.query('BEGIN');
      await client.query(`SET LOCAL app.customers = '{${customerId}}'`);
      await client.query(`SET LOCAL app.policy_types = '{health}'`);
      const { rows } = await client.query(
        'SELECT id, customer_id, type FROM policies WHERE policy_number = $1',
        ['RLS-TEST-POL-001'],
      );
      await client.query('ROLLBACK');

      expect(rows).toHaveLength(1);
      expect(rows[0].customer_id).toBe(customerId);
      expect(rows[0].type).toBe('health');
    } finally {
      client.release();
    }
  });

  it('returns zero rows when policy type is outside the session scope', async () => {
    const client = await appUser.connect();
    try {
      await client.query('BEGIN');
      await client.query(`SET LOCAL app.customers = '{${customerId}}'`);
      await client.query(`SET LOCAL app.policy_types = '{auto}'`);
      const { rows } = await client.query('SELECT id FROM policies');
      await client.query('ROLLBACK');

      expect(rows).toHaveLength(0);
    } finally {
      client.release();
    }
  });
});
