import { Controller, Get, Logger, Param } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { AllowPublicAccess } from '../../auth/decorators/allow-public-access.decorator';
import { CorrelatedActionsFields } from '../correlated-actions/correlated-actions.dto';
import {
  ActionDefinitionEssential,
  ActionTypeEnum,
  TreeNode,
} from '../index-domain';
import { ReferentielId } from '../models/referentiel-id.enum';
import {
  GetReferentielService,
  ReferentielResponse,
} from './get-referentiel.service';

class ReferentielResponseClass implements ReferentielResponse {
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
export class GetReferentielController {
  private readonly logger = new Logger(GetReferentielController.name);

  constructor(private readonly getReferentielService: GetReferentielService) {}

  @AllowPublicAccess()
  @Get(':referentiel_id')
  @ApiResponse({ type: ReferentielResponseClass })
  async getReferentiel(@Param('referentiel_id') referentielId: ReferentielId) {
    return this.getReferentielService.getReferentielTree(referentielId, true);
  }
}
