import type { z } from 'zod';
import { listCollectiviteApiRequestSchema } from '@tet/backend/collectivites/list-collectivites/list-collectivites.api-request';
import { listCollectiviteApiResponseSchema } from '@tet/backend/collectivites/list-collectivites/list-collectivites.api-response';
import ListCollectivitesService from '@tet/backend/collectivites/list-collectivites/list-collectivites.service';
import { AllowAnonymousAccess } from '@tet/backend/users/decorators/allow-anonymous-access.decorator';
import { ApiUsageEnum } from '@tet/backend/utils/api/api-usage-type.enum';
import { ApiUsage } from '@tet/backend/utils/api/api-usage.decorator';
import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

export type ListCollectivitesApiRequest = z.infer<
  typeof listCollectiviteApiRequestSchema
>;

@ApiTags('Collectivités')
@ApiBearerAuth()
@Controller()
export class CollectiviteController {
  constructor(
    private readonly listCollectivitesService: ListCollectivitesService
  ) {}

  @AllowAnonymousAccess()
  @ApiUsage([ApiUsageEnum.EXTERNAL_API])
  @Get('collectivites')
  @ApiOperation({
    summary: "Récupération des informations d'une ou plusieurs collectivités",
    description:
      "Récupération des informations (siren, etc.) d'une ou plusieurs collectivités. \n\nLes données sont publiques et donc accessibles **quelque soit les droits de l'utilisateur**.",
  })
  @ApiOkResponse({
    standardSchema: listCollectiviteApiResponseSchema.meta({
      id: 'ListCollectivitesApiResponseClass',
    }),
    description: "Informations d'une ou plusieurs collectivités",
  })
  async getCollectivites(
    @Query({ schema: listCollectiviteApiRequestSchema })
    request: ListCollectivitesApiRequest
  ) {
    if (!request.fieldsMode) {
      request.fieldsMode = 'public';
    }
    return this.listCollectivitesService.listCollectivites(request);
  }
}
