import type { z } from 'zod';
import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { listCollectiviteApiRequestSchema } from '@tet/backend/collectivites/list-collectivites/list-collectivites.api-request';
import { listLabellisationApiResponseSchema } from '@tet/backend/referentiels/labellisations/list-labellisations.api-response';
import { ListLabellisationsService } from '@tet/backend/referentiels/labellisations/list-labellisations.service';
import { AllowAnonymousAccess } from '@tet/backend/users/decorators/allow-anonymous-access.decorator';
import { ApiUsageEnum } from '@tet/backend/utils/api/api-usage-type.enum';
import { ApiUsage } from '@tet/backend/utils/api/api-usage.decorator';

export type ListLabellisationsApiRequest = z.infer<
  typeof listCollectiviteApiRequestSchema
>;

@ApiTags('Collectivités')
@ApiBearerAuth()
@Controller()
export class ListLabellisationsController {
  constructor(
    private readonly listLabellisationService: ListLabellisationsService
  ) {}

  @AllowAnonymousAccess()
  @ApiUsage([ApiUsageEnum.EXTERNAL_API])
  @ApiOperation({
    summary: "Récupération des labellisations d'une ou plusieurs collectivités",
    description:
      "Récupération des informations de labellisation (etoiles, scores) d'une ou plusieurs collectivités. \n\nLes données sont publiques et donc accessibles **quelque soit les droits de l'utilisateur**.",
  })
  @Get('collectivites/labellisations')
  @ApiOkResponse({
    standardSchema: listLabellisationApiResponseSchema.meta({
      id: 'ListLabellisationsApiResponseClass',
    }),
    description:
      "Récupération les labellisations d'une ou plusieurs collectivités",
  })
  async getCollectivitesLabellisations(
    @Query({ schema: listCollectiviteApiRequestSchema })
    request: ListLabellisationsApiRequest
  ) {
    return this.listLabellisationService.listCollectiviteLabellisations(
      request
    );
  }
}
