import { Controller, Get } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { HealthCheck } from '@nestjs/terminus';
import { SkipThrottle } from '@nestjs/throttler';
import { AllowPublicAccess } from '../../users/decorators/allow-public-access.decorator';
import { RuntimeHealthService } from './runtime-health.service';

@ApiExcludeController()
@SkipThrottle()
@Controller('health')
export class RuntimeHealthController {
  constructor(private readonly health: RuntimeHealthService) {}

  @AllowPublicAccess()
  @Get('live')
  liveness() {
    return { status: 'ok' };
  }

  @AllowPublicAccess()
  @HealthCheck()
  @Get('ready')
  readiness() {
    return this.health.readiness();
  }
}
