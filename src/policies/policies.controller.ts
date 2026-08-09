import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PolicyStatus } from './enums/policy-status.enum';
import { PolicyType } from './enums/policy-type.enum';
import { PoliciesService } from './policies.service';

@UseGuards(JwtAuthGuard)
@Controller('policies')
export class PoliciesController {
  constructor(private readonly policiesService: PoliciesService) {}

  @Get()
  findAll(
    @Query('customer_id') customerId?: string,
    @Query('type') type?: PolicyType,
    @Query('status') status?: PolicyStatus,
  ) {
    return this.policiesService.findAll({ customerId, type, status });
  }
}
