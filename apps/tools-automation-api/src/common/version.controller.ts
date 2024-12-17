import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';

@Controller()
export class VersionController {
  @Get('version')
  @ApiOkResponse({
    description:
      'Informations de version (commit, version, environnement, date de déploiement, date du commit)',
  })
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
