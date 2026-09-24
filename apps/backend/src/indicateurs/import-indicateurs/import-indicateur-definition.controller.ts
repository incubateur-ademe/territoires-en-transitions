import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiExcludeController, ApiTags } from '@nestjs/swagger';
import { ApiUsageEnum } from '@tet/backend/utils/api/api-usage-type.enum';
import { ApiUsage } from '@tet/backend/utils/api/api-usage.decorator';
import { TokenInfo } from '../../users/decorators/token-info.decorators';
import type { AuthenticatedOrServiceRoleUser } from '../../users/models/auth.models';
import ImportIndicateurDefinitionService from './import-indicateur-definition.service';

@ApiTags('Indicateurs')
@ApiBearerAuth()
@ApiExcludeController()
@Controller('indicateur-definitions')
export class ImportIndicateurDefinitionController {
  private readonly logger = new Logger(
    ImportIndicateurDefinitionController.name
  );

  constructor(
    private readonly importIndicateurService: ImportIndicateurDefinitionService
  ) {}

  @ApiUsage([ApiUsageEnum.GOOGLE_SHEETS])
  @Post('import')
  @HttpCode(HttpStatus.OK)
  async importIndicateurDefinitions(
    @TokenInfo() user: AuthenticatedOrServiceRoleUser
  ) {
    return this.importIndicateurService.importIndicateurDefinitions(user);
  }

  @ApiUsage([ApiUsageEnum.GOOGLE_SHEETS])
  @Get('verify')
  async verifyIndicateurDefinitions(
    @TokenInfo() user: AuthenticatedOrServiceRoleUser
  ) {
    return this.importIndicateurService.verifyIndicateurDefinitions(user);
  }
}
