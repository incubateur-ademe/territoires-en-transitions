import { Controller, Get, Logger, Post } from '@nestjs/common';
import { ApiHideProperty, ApiTags } from '@nestjs/swagger';
import { AllowAnonymousAccess } from '../../auth/decorators/allow-anonymous-access.decorator';
import { TokenInfo } from '../../auth/decorators/token-info.decorators';
import { AuthRole, AuthUser } from '../../auth/models/auth.models';
import ImportIndicateurDefinitionService from './import-indicateur-definition.service';

@ApiTags('Indicateurs')
@Controller('indicateurs')
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
  @Get('import')
  //@ApiResponse({ type: GetReferentielResponseClass }) // TODO
  async importIndicateurDefinitions(
    @TokenInfo() tokenInfo: AuthUser
  ): Promise<any> {
    // TODO
    return this.importIndicateurService.importIndicateurDefinitions();
  }

  /**
   * Only to initialize the spreadsheet with the definitions.
   * @param tokenInfo
   * @returns
   */
  @Post('fill-spreadsheet')
  @ApiHideProperty()
  async fillSpreadsheetWithIndicateurDefinitions(
    @TokenInfo() tokenInfo: AuthUser
  ) {
    if (tokenInfo.role !== AuthRole.SERVICE_ROLE) {
      throw new Error(
        'Only service account can fill the spreadsheet with indicateur definitions'
      );
    }
    return this.importIndicateurService.fillSpreadsheetWithIndicateurDefinitions();
  }
}
