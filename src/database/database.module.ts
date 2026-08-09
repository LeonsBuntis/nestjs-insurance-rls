import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RlsSetupService } from './rls-setup.service';

@Module({
  imports: [TypeOrmModule],
  providers: [RlsSetupService],
})
export class DatabaseModule {}
