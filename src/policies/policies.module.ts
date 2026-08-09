import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { AutoPolicy } from './entities/auto-policy.entity';
import { HealthPolicy } from './entities/health-policy.entity';
import { PropertyPolicy } from './entities/property-policy.entity';
import { PoliciesController } from './policies.controller';
import { PoliciesService } from './policies.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([HealthPolicy, PropertyPolicy, AutoPolicy]),
    AuthModule,
  ],
  controllers: [PoliciesController],
  providers: [PoliciesService],
})
export class PoliciesModule {}
