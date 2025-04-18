import { Controller, Get, Logger } from '@nestjs/common';
import { ApiHideProperty, ApiTags } from '@nestjs/swagger';
import { AllowAnonymousAccess } from '../../auth/decorators/allow-anonymous-access.decorator';
import { TokenInfo } from '../../auth/decorators/token-info.decorators';
import { AuthUser } from '../../auth/models/auth.models';
import ImportIndicateurDefinitionService from './import-indicateur-definition.service';

@ApiTags('Indicateurs')
@Controller('indicateur-definitions')
export class ImportIndicateurDefinitionController {
  private readonly logger = new Logger(
    ImportIndicateurDefinitionController.name
  );

  constructor(
    private readonly importIndicateurService: ImportIndicateurDefinitionService
  ) {}

  /**
   * Protected because the content of the import is not given:
   * An attacker must have write access to the spreadhsheet to import it.
   * @param referentielId
   * @param tokenInfo
   * @returns
   */
  @AllowAnonymousAccess()
  @ApiHideProperty()
  @Get('import')
  async importIndicateurDefinitions(@TokenInfo() tokenInfo: AuthUser) {
    return this.importIndicateurService.importIndicateurDefinitions();
  }
}
