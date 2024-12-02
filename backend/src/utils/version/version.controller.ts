import { createZodDto } from '@anatine/zod-nestjs';
import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { ApiHideProperty, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AllowAnonymousAccess } from '../../auth/decorators/allow-anonymous-access.decorator';
import { AllowPublicAccess } from '../../auth/decorators/allow-public-access.decorator';
import { versionResponseSchema } from './version.models';

/**
 * Création des classes de réponse à partir du schema pour générer automatiquement la documentation OpenAPI
 */

export class VersionResponseClass extends createZodDto(versionResponseSchema) {}

@ApiTags('Application')
@Controller()
export class VersionController {
  @AllowAnonymousAccess()
  @ApiHideProperty()
  @Get('throw')
  async throw() {
    throw new HttpException(
      'This is a an api test error',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }

  @AllowPublicAccess()
  @Get('version')
  @ApiOkResponse({
    type: VersionResponseClass,
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
