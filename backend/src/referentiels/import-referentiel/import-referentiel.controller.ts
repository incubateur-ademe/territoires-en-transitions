import { Controller, Get, Logger, Param } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { AllowAnonymousAccess } from '../../auth/decorators/allow-anonymous-access.decorator';
import { CorrelatedActionsFields } from '../correlated-actions/correlated-actions.dto';
import { ReferentielResponse } from '../get-referentiel/get-referentiel.service';
import {
  ActionDefinitionEssential,
  ActionTypeEnum,
  TreeNode,
} from '../index-domain';
import { ReferentielId } from '../models/referentiel-id.enum';
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
@Controller('referentiels')
export class ImportReferentielController {
  private readonly logger = new Logger(ImportReferentielController.name);

  constructor(private readonly importService: ImportReferentielService) {}

  @AllowAnonymousAccess()
  @Get(':referentiel_id/import')
  @ApiResponse({ type: ImportReferentielResponse })
  async importReferentiel(
    @Param('referentiel_id') referentielId: ReferentielId
  ) {
    return this.importService.importReferentiel(referentielId);
  }
}
