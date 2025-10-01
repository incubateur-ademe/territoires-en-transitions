import {
  ActionDefinitionEssential,
  TreeNode,
} from '@/backend/referentiels/models/action-definition.dto';
import { ActionTypeEnum } from '@/backend/referentiels/models/action-type.enum';
import { ReferentielId } from '@/backend/referentiels/models/referentiel-id.enum';
import { ApiUsageEnum } from '@/backend/utils/api/api-usage-type.enum';
import { ApiUsage } from '@/backend/utils/api/api-usage.decorator';
import { Controller, Get, Logger, Param } from '@nestjs/common';
import { ApiExcludeController, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AllowAnonymousAccess } from '../../users/decorators/allow-anonymous-access.decorator';
import { CorrelatedActionsFields } from '../correlated-actions/correlated-actions.dto';
import { ReferentielResponse } from '../get-referentiel/get-referentiel.service';
import { ImportReferentielService } from './import-referentiel.service';

class ImportReferentielResponse implements ReferentielResponse {
  constructor(
    public version: string,
    public orderedItemTypes: ActionTypeEnum[],
    public itemsTree: TreeNode<
      ActionDefinitionEssential & CorrelatedActionsFields
    >
  ) {}
}

@ApiTags('Referentiels')
@ApiExcludeController()
@Controller('referentiels')
export class ImportReferentielController {
  private readonly logger = new Logger(ImportReferentielController.name);

  constructor(private readonly importService: ImportReferentielService) {}

  @AllowAnonymousAccess()
  @Get(':referentiel_id/import')
  @ApiUsage([ApiUsageEnum.GOOGLE_SHEETS])
  @ApiResponse({ type: ImportReferentielResponse })
  async importReferentiel(
    @Param('referentiel_id') referentielId: ReferentielId
  ) {
    return this.importService.importReferentiel(referentielId);
  }

  @AllowAnonymousAccess()
  @Get(':referentiel_id/updateReferentielMesureIndicateurs')
  async updateReferentielMesureIndicateurs(
    @Param('referentiel_id') referentielId: ReferentielId
  ) {
    return this.importService.updateReferentielMesureIndicateurs(referentielId);
  }

  @AllowAnonymousAccess()
  @Get(':referentiel_id/verify')
  @ApiUsage([ApiUsageEnum.GOOGLE_SHEETS])
  @ApiResponse({ type: ImportReferentielResponse })
  async verifyExpressions(
    @Param('referentiel_id') referentielId: ReferentielId
  ) {
    return this.importService.verifyReferentiel(referentielId);
  }
}
