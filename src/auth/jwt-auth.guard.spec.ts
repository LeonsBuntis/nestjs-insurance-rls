import { Controller, Get, INestApplication, Req, UseGuards } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthModule } from './auth.module';
import { Principal } from './principal.interface';

const TEST_SECRET = 'test-secret';

@Controller('protected')
class TestController {
  @UseGuards(JwtAuthGuard)
  @Get()
  getProtected(@Req() req: { principal: Principal }) {
    return req.principal;
  }
}

describe('JwtAuthGuard', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;

  beforeEach(async () => {
    process.env.JWT_SECRET = TEST_SECRET;
    const module = await Test.createTestingModule({
      imports: [AuthModule],
      controllers: [TestController],
    }).compile();

    app = module.createNestApplication();
    jwtService = module.get(JwtService);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    delete process.env.JWT_SECRET;
  });

  it('returns 401 when no Authorization header is provided', () => {
    return request(app.getHttpServer()).get('/protected').expect(401);
  });

  it('returns 401 when Bearer token is invalid', () => {
    return request(app.getHttpServer())
      .get('/protected')
      .set('Authorization', 'Bearer not-a-valid-jwt')
      .expect(401);
  });

  it('returns 401 when token is signed with a different secret', () => {
    const badToken = jwtService.sign(
      { sub: 'u1', customers: [], policy_types: [] },
      { secret: 'wrong-secret' },
    );
    return request(app.getHttpServer())
      .get('/protected')
      .set('Authorization', `Bearer ${badToken}`)
      .expect(401);
  });

  it('populates req.principal from a valid JWT', async () => {
    const token = jwtService.sign({
      sub: 'user-42',
      customers: ['cust-1', 'cust-2'],
      policy_types: ['health', 'auto'],
    });

    const res = await request(app.getHttpServer())
      .get('/protected')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toMatchObject({
      sub: 'user-42',
      customers: ['cust-1', 'cust-2'],
      policy_types: ['health', 'auto'],
    });
  });
});
