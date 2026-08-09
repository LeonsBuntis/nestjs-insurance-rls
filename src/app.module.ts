import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { MockAuthModule } from './auth/mock-auth/mock-auth.module';
import { CustomersModule } from './customers/customers.module';
import { DatabaseModule } from './database/database.module';
import { PoliciesModule } from './policies/policies.module';

const conditionalImports = process.env.MOCK_AUTH_ENABLED === 'true' ? [MockAuthModule] : [];

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: parseInt(process.env.DB_PORT ?? '5432'),
      username: process.env.APP_DB_USER ?? 'app_user',
      password: process.env.APP_DB_PASSWORD ?? 'app_password',
      database: process.env.DB_NAME ?? 'insurance',
      autoLoadEntities: true,
      // never enable synchronize in production — use migrations instead
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    AuthModule,
    CustomersModule,
    DatabaseModule,
    PoliciesModule,
    ...conditionalImports,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
