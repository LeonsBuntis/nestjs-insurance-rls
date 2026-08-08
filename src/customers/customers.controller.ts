import { Controller, Get, Param, Query } from '@nestjs/common';
import { PolicyStatus } from '../policies/enums/policy-status.enum';
import { CustomersService } from './customers.service';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get(':id/policies')
  findPolicies(
    @Param('id') id: string,
    @Query('status') status?: PolicyStatus,
  ) {
    return this.customersService.findPolicies(id, status);
  }
}
