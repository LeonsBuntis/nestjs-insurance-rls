import { Body, Controller, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IsArray, IsString } from 'class-validator';

class IssueTokenDto {
  @IsString()
  sub: string;

  @IsArray()
  @IsString({ each: true })
  customers: string[];

  @IsArray()
  @IsString({ each: true })
  policy_types: string[];
}

@Controller('auth')
export class MockAuthController {
  constructor(private readonly jwtService: JwtService) {}

  @Post('token')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  issueToken(@Body() dto: IssueTokenDto): { access_token: string } {
    const token = this.jwtService.sign({
      sub: dto.sub,
      customers: dto.customers,
      policy_types: dto.policy_types,
    });
    return { access_token: token };
  }
}
