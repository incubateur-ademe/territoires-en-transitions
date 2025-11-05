import { ActionTreeNode } from '@/domain/referentiels';
import {
  REFERENTIEL_ID_PARAM_KEY,
  REFERENTIEL_ID_ROUTE_PARAM,
} from '@/backend/referentiels/models/referentiel-api.constants';
import { AllowPublicAccess } from '@/backend/users/decorators/allow-public-access.decorator';
import { ApiUsageEnum } from '@/backend/utils/api/api-usage-type.enum';
import { ApiUsage } from '@/backend/utils/api/api-usage.decorator';
import {
  ActionDefinitionEssential,
  ActionTypeEnum,
  referentielDefinitionSchema,
  type ReferentielId,
} from '@/domain/referentiels';
import { Controller, Get, Logger, Param } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExcludeEndpoint,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { omit } from 'es-toolkit';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';
import * as zm from 'zod/mini';
import { CorrelatedActionsFields } from '../../correlated-actions/correlated-actions.dto';
import {
  GetReferentielService,
  ReferentielResponse,
} from '../../get-referentiel/get-referentiel.service';
import { GetReferentielDefinitionService } from './get-referentiel-definition.service';

class ReferentielResponseClass implements ReferentielResponse {
  constructor(
    public version: string,
    public orderedItemTypes: ActionTypeEnum[],
    public itemsTree: ActionTreeNode<
      ActionDefinitionEssential & CorrelatedActionsFields
    >
  ) {}
}

const listReferentielsResponseSchema = z.array(
  zm.omit(referentielDefinitionSchema, {
    createdAt: true,
    locked: true,
  })
);

export class ListReferentielsResponseClass extends createZodDto(
  listReferentielsResponseSchema
) {}

@ApiTags('Referentiels')
@ApiBearerAuth()
@Controller('referentiels')
export class GetReferentielController {
  private readonly logger = new Logger(GetReferentielController.name);

  constructor(
    private readonly getReferentielService: GetReferentielService,
    private readonly getReferentielDefinitionService: GetReferentielDefinitionService
  ) {}

  @AllowPublicAccess()
  @Get(REFERENTIEL_ID_ROUTE_PARAM)
  @ApiExcludeEndpoint()
  @ApiUsage([ApiUsageEnum.DEBUG])
  @ApiResponse({ type: ReferentielResponseClass })
  async getReferentiel(
    @Param(REFERENTIEL_ID_PARAM_KEY) referentielId: ReferentielId
  ) {
    return this.getReferentielService.getReferentielTree(referentielId, true);
  }

  @AllowPublicAccess()
  @Get()
  @ApiUsage([ApiUsageEnum.EXTERNAL_API])
  @ApiOperation({
    summary: 'Liste les référentiels (CAE, ECI, etc.) définis sur plateforme',
    description:
      "Récupère la liste des référentiels définis sur la plateforme. Les référentiels permettent de réaliser les états des lieux d'une collectivité afin d'évaluer le niveau d'avancement dans la transition écologique.\n\nLa route est accessible à tous les utilisateurs quel que soit leurs droits.",
  })
  @ApiResponse({ type: ListReferentielsResponseClass })
  async getReferentielDefinitions(): Promise<ListReferentielsResponseClass> {
    const definitions =
      await this.getReferentielDefinitionService.getReferentielDefinitions();

    return definitions.map((r) => omit(r, ['createdAt', 'locked']));
  }
}
