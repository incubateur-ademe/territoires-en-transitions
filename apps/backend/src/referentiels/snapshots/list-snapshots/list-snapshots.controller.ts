import type { z } from 'zod';
import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { COLLECTIVITE_ID_ROUTE_PARAM } from '@tet/backend/collectivites/collectivite-api.constants';
import { REFERENTIEL_ID_ROUTE_PARAM } from '@tet/backend/referentiels/models/referentiel-api.constants';
import { listSnapshotsApiParamsSchema } from '@tet/backend/referentiels/snapshots/list-snapshots/list-snapshots.api-params';
import { listSnapshotsApiQuerySchema } from '@tet/backend/referentiels/snapshots/list-snapshots/list-snapshots.api-query';
import { listSnapshotsApiResponseSchema } from '@tet/backend/referentiels/snapshots/list-snapshots/list-snapshots.api-response';
import { ListSnapshotsService } from '@tet/backend/referentiels/snapshots/list-snapshots/list-snapshots.service';
import { AllowAnonymousAccess } from '@tet/backend/users/decorators/allow-anonymous-access.decorator';
import { ApiUsageEnum } from '@tet/backend/utils/api/api-usage-type.enum';
import { ApiUsage } from '@tet/backend/utils/api/api-usage.decorator';

export type ListSnapshotsApiParams = z.infer<
  typeof listSnapshotsApiParamsSchema
>;

export type ListSnapshotsApiQuery = z.infer<typeof listSnapshotsApiQuerySchema>;

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
    standardSchema: listSnapshotsApiResponseSchema.meta({
      id: 'ListSnapshotsApiResponseClass',
    }),
    description: "Les snapshots de score d'une collectivité.",
  })
  async getCollectiviteReferentielScoreSnapshots(
    @Param({ schema: listSnapshotsApiParamsSchema })
    param: ListSnapshotsApiParams,
    @Query({ schema: listSnapshotsApiQuerySchema })
    query: ListSnapshotsApiQuery
  ) {
    return this.listSnapshotsService.list({
      collectiviteId: param.collectiviteId,
      referentielId: param.referentielId,
      options: query,
    });
  }
}
