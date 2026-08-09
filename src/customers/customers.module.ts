import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutoPolicy } from '../policies/entities/auto-policy.entity';
import { HealthPolicy } from '../policies/entities/health-policy.entity';
import { Policy } from '../policies/entities/policy.entity';
import { PropertyPolicy } from '../policies/entities/property-policy.entity';
import { Customer } from './customer.entity';
import { CustomersService } from './customers.service';

@Module({
  imports: [TypeOrmModule.forFeature([Customer, Policy, HealthPolicy, PropertyPolicy, AutoPolicy])],
  controllers: [],
  providers: [CustomersService],
})
export class CustomersModule {}
