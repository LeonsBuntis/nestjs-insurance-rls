import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { MockAuthController } from './mock-auth.controller';

describe('MockAuthController', () => {
  let controller: MockAuthController;
  let jwtService: JwtService;

  beforeEach(async () => {
    process.env.JWT_SECRET = 'test-secret';
    const module = await Test.createTestingModule({
      imports: [
        JwtModule.registerAsync({
          useFactory: () => ({
            secret: process.env.JWT_SECRET ?? 'changeme',
            signOptions: { expiresIn: '1h' },
          }),
        }),
      ],
      controllers: [MockAuthController],
    }).compile();

    controller = module.get(MockAuthController);
    jwtService = module.get(JwtService);
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  it('returns a signed JWT containing sub, customers and policy_types', () => {
    const result = controller.issueToken({
      sub: 'agent-1',
      customers: ['cust-a'],
      policy_types: ['health'],
    });

    const decoded = jwtService.verify<{ sub: string; customers: string[]; policy_types: string[] }>(
      result.access_token,
      { secret: 'test-secret' },
    );
    expect(decoded.sub).toBe('agent-1');
    expect(decoded.customers).toEqual(['cust-a']);
    expect(decoded.policy_types).toEqual(['health']);
  });
});
