import { Controller, Get, Query, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RlsInterceptor } from '../database/rls.interceptor';
import { PolicyStatus } from './enums/policy-status.enum';
import { PolicyType } from './enums/policy-type.enum';
import { PoliciesService } from './policies.service';
import { EntityManager } from 'typeorm';

@UseGuards(JwtAuthGuard)
@UseInterceptors(RlsInterceptor)
@Controller('policies')
export class PoliciesController {
  constructor(private readonly policiesService: PoliciesService) {}

  @Get()
  findAll(
    @Req() req: { entityManager?: EntityManager },
    @Query('customer_id') customerId?: string,
    @Query('type') type?: PolicyType,
    @Query('status') status?: PolicyStatus,
  ) {
    return this.policiesService.findAll({ customerId, type, status }, req.entityManager);
  }
}
