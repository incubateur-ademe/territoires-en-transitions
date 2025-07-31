import { COLLECTIVITE_ID_ROUTE_PARAM } from '@/backend/collectivites/collectivite-api.constants';
import { REFERENTIEL_ID_ROUTE_PARAM } from '@/backend/referentiels/models/referentiel-api.constants';
import { listSnapshotsApiParamsSchema } from '@/backend/referentiels/snapshots/list-snapshots/list-snapshots.api-params';
import { listSnapshotsApiQuerySchema } from '@/backend/referentiels/snapshots/list-snapshots/list-snapshots.api-query';
import { listSnapshotsApiResponseSchema } from '@/backend/referentiels/snapshots/list-snapshots/list-snapshots.api-response';
import { ListSnapshotsService } from '@/backend/referentiels/snapshots/list-snapshots/list-snapshots.service';
import { AllowAnonymousAccess } from '@/backend/users/decorators/allow-anonymous-access.decorator';
import { ApiUsageEnum } from '@/backend/utils/api/api-usage-type.enum';
import { ApiUsage } from '@/backend/utils/api/api-usage.decorator';
import { createZodDto } from '@anatine/zod-nestjs';
import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

/**
 * Création des classes de réponse à partir du schema pour générer automatiquement la documentation OpenAPI
 */
export class ListSnapshotsApiParamsClass extends createZodDto(
  listSnapshotsApiParamsSchema
) {}

export class ListSnapshotsApiQueryClass extends createZodDto(
  listSnapshotsApiQuerySchema
) {}

export class ListSnapshotsApiResponseClass extends createZodDto(
  listSnapshotsApiResponseSchema
) {}

@ApiTags('Referentiels')
@ApiBearerAuth()
@Controller()
export class ListSnapshotsController {
  constructor(private readonly listSnapshotsService: ListSnapshotsService) {}

  @AllowAnonymousAccess()
  @Get(
    `collectivites/${COLLECTIVITE_ID_ROUTE_PARAM}/referentiels/${REFERENTIEL_ID_ROUTE_PARAM}/score-snapshots`
  )
  @ApiOperation({
    summary:
      "Récupération des snapshots de score d'une collectivité pour un référentiel donné.",
    description:
      "Les scores permettent d'évaluer l'état des lieux d'une collectivité pour une référentiel donné (CAE, ECI) à un moment précis identifié par jalon (pre-audit, post-audit, etc.).\n\nLes scores sont publics et donc accessibles **quelque soit les droits de l'utilisateur**.",
  })
  @ApiUsage([ApiUsageEnum.EXTERNAL_API])
  @ApiOkResponse({
    type: ListSnapshotsApiResponseClass,
    description: "Les snapshots de score d'une collectivité.",
  })
  async getCollectiviteReferentielScoreSnapshots(
    @Param() param: ListSnapshotsApiParamsClass,
    @Query() query: ListSnapshotsApiQueryClass
  ) {
    return this.listSnapshotsService.list({
      collectiviteId: param.collectiviteId,
      referentielId: param.referentielId,
      options: query,
    });
  }
}
