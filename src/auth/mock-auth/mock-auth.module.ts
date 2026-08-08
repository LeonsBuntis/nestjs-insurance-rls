import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MockAuthController } from './mock-auth.controller';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET ?? 'changeme',
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  controllers: [MockAuthController],
})
export class MockAuthModule {}
