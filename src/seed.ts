import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from './app.module';
import { Customer } from './customers/customer.entity';
import { Policy } from './policies/entities/policy.entity';
import { HealthPolicy, CoverageTier } from './policies/entities/health-policy.entity';
import { PropertyPolicy, PropertyType } from './policies/entities/property-policy.entity';
import { AutoPolicy, VehicleCategory } from './policies/entities/auto-policy.entity';
import { PolicyStatus } from './policies/enums/policy-status.enum';
import { PolicyType } from './policies/enums/policy-type.enum';

async function seed() {
  // Boot the app so RlsSetupService.onModuleInit() installs the RLS policies.
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  await app.close();

  // Superusers always bypass RLS (even FORCE ROW LEVEL SECURITY), so use the
  // postgres role for seeding to avoid app_user being subject to RLS policies.
  const ds = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432'),
    username: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: process.env.DB_NAME ?? 'insurance',
    entities: [Customer, Policy, HealthPolicy, PropertyPolicy, AutoPolicy],
  });
  await ds.initialize();

  await ds.transaction(async (em) => {
    // Remove existing data in dependency order
    await em.query('TRUNCATE TABLE health_policies, property_policies, auto_policies, policies, customers RESTART IDENTITY CASCADE');

    // Customers
    const [acme, brightway, nordic] = await em.save(Customer, [
      { name: 'Acme Corp', registrationNumber: 'KVK-12345678', country: 'NL' },
      { name: 'Brightway Ltd', registrationNumber: 'CH-123.456.789', country: 'CH' },
      { name: 'Nordic Ventures AS', registrationNumber: 'NO-987654321', country: 'NO' },
    ]);

    // Policies
    const policies = await em.save(Policy, [
      // Acme — health (active) + property (active) + auto (cancelled)
      { customerId: acme.id, type: PolicyType.HEALTH, policyNumber: 'POL-001', premium: '1200.00', startDate: '2025-01-01', endDate: '2025-12-31', status: PolicyStatus.ACTIVE },
      { customerId: acme.id, type: PolicyType.PROPERTY, policyNumber: 'POL-002', premium: '3400.00', startDate: '2025-03-01', endDate: '2026-02-28', status: PolicyStatus.ACTIVE },
      { customerId: acme.id, type: PolicyType.AUTO, policyNumber: 'POL-003', premium: '800.00', startDate: '2024-06-01', endDate: '2025-05-31', status: PolicyStatus.CANCELLED },
      // Brightway — health (pending) + auto (active)
      { customerId: brightway.id, type: PolicyType.HEALTH, policyNumber: 'POL-004', premium: '2100.00', startDate: '2026-09-01', endDate: '2027-08-31', status: PolicyStatus.PENDING },
      { customerId: brightway.id, type: PolicyType.AUTO, policyNumber: 'POL-005', premium: '1500.00', startDate: '2025-07-01', endDate: '2026-06-30', status: PolicyStatus.ACTIVE },
      // Nordic — property (expired) + health (active)
      { customerId: nordic.id, type: PolicyType.PROPERTY, policyNumber: 'POL-006', premium: '5000.00', startDate: '2024-01-01', endDate: '2024-12-31', status: PolicyStatus.EXPIRED },
      { customerId: nordic.id, type: PolicyType.HEALTH, policyNumber: 'POL-007', premium: '1800.00', startDate: '2025-06-01', endDate: '2026-05-31', status: PolicyStatus.ACTIVE },
    ]);

    const [p001, p002, p003, p004, p005, p006, p007] = policies;

    // Type-specific detail tables
    await em.save(HealthPolicy, [
      { policyId: p001.id, coveredEmployeeCount: 120, coverageTier: CoverageTier.STANDARD },
      { policyId: p004.id, coveredEmployeeCount: 45, coverageTier: CoverageTier.PREMIUM },
      { policyId: p007.id, coveredEmployeeCount: 80, coverageTier: CoverageTier.BASIC },
    ]);

    await em.save(PropertyPolicy, [
      { policyId: p002.id, propertyAddress: 'Keizersgracht 123, Amsterdam', insuredValue: '2500000.00', propertyType: PropertyType.OFFICE },
      { policyId: p006.id, propertyAddress: 'Storgata 8, Oslo', insuredValue: '1800000.00', propertyType: PropertyType.WAREHOUSE },
    ]);

    await em.save(AutoPolicy, [
      { policyId: p003.id, insuredVehicleCount: 12, vehicleCategory: VehicleCategory.MIXED },
      { policyId: p005.id, insuredVehicleCount: 6, vehicleCategory: VehicleCategory.CARS },
    ]);
  });

  console.log('Seed complete: 3 customers, 7 policies');
  await ds.destroy();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
