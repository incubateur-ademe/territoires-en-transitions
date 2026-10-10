import { Controller, Get, Logger } from '@nestjs/common';
import { ApiBearerAuth, ApiExcludeController, ApiTags } from '@nestjs/swagger';
import { ApiUsageEnum } from '@tet/backend/utils/api/api-usage-type.enum';
import { ApiUsage } from '@tet/backend/utils/api/api-usage.decorator';
import { AllowAnonymousAccess } from '../../users/decorators/allow-anonymous-access.decorator';
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

  /**
   * The caller cannot supply definitions or a spreadsheet ID. Import only the
   * configured catalogue, whose contents are controlled by spreadsheet editors.
   */
  @AllowAnonymousAccess()
  @ApiUsage([ApiUsageEnum.GOOGLE_SHEETS])
  @Get('import')
  async importIndicateurDefinitions() {
    return this.importIndicateurService.importIndicateurDefinitions();
  }

  @AllowAnonymousAccess()
  @ApiUsage([ApiUsageEnum.GOOGLE_SHEETS])
  @Get('verify')
  async verifyIndicateurDefinitions() {
    return this.importIndicateurService.verifyIndicateurDefinitions();
  }
}
