import { Controller, Get } from '@nestjs/common';
import { PublicEndpoint } from '../../auth/decorators/public-endpoint.decorator';

@Controller()
export class VersionController {
  @PublicEndpoint()
  @Get('version')
  async getVersion() {
    return {
      commit: process.env.GIT_COMMIT_SHORT_SHA,
      version: process.env.APPLICATION_VERSION,
      environment: process.env.ENV_NAME,
      deploy_time: process.env.DEPLOYMENT_TIMESTAMP,
      commit_time: process.env.GIT_COMMIT_TIMESTAMP,
    };
  }
}
