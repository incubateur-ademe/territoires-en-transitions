import { ApiUsageEnum } from '@tet/backend/utils/api/api-usage-type.enum';
import { ApiUsage } from '@tet/backend/utils/api/api-usage.decorator';
import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { versionResponseSchema } from '@tet/domain/utils';
import { AllowAnonymousAccess } from '../../users/decorators/allow-anonymous-access.decorator';
import { AllowPublicAccess } from '../../users/decorators/allow-public-access.decorator';
import VersionService from './version.service';

@ApiTags('Application')
@Controller()
export class VersionController {
  constructor(private readonly versionService: VersionService) {}

  @AllowAnonymousAccess()
  @ApiUsage([ApiUsageEnum.DEBUG])
  @ApiExcludeEndpoint()
  @Get('throw')
  async throw() {
    throw new HttpException(
      'This is a an api test error',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }

  @AllowPublicAccess()
  @ApiExcludeEndpoint()
  @ApiUsage([ApiUsageEnum.DEBUG])
  @Get('version')
  @ApiOkResponse({
    standardSchema: versionResponseSchema.meta({ id: 'VersionResponseClass' }),
    description:
      'Informations de version (commit, version, environnement, date de déploiement, date du commit)',
  })
  async getVersion() {
    return this.versionService.getVersion();
  }
}
