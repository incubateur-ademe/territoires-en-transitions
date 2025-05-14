import { AllowAnonymousAccess } from '@/backend/auth/decorators/allow-anonymous-access.decorator';
import { listCollectiviteApiRequestSchema } from '@/backend/collectivites/list-collectivites/list-collectivites.api-request';
import { listCollectiviteApiResponseSchema } from '@/backend/collectivites/list-collectivites/list-collectivites.api-response';
import ListCollectivitesService from '@/backend/collectivites/list-collectivites/list-collectivites.service';
import { createZodDto } from '@anatine/zod-nestjs';
import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

/**
 * Création des classes de réponse à partir du schema pour générer automatiquement la documentation OpenAPI
 */
export class ListCollectivitesApiRequestClass extends createZodDto(
  listCollectiviteApiRequestSchema
) {}

export class ListCollectivitesApiResponseClass extends createZodDto(
  listCollectiviteApiResponseSchema
) {}

@ApiTags('Collectivités')
@Controller()
export class CollectiviteController {
  constructor(
    private readonly listCollectivitesService: ListCollectivitesService
  ) {}

  @AllowAnonymousAccess()
  @Get('collectivites')
  @ApiOkResponse({
    type: ListCollectivitesApiResponseClass,
    description:
      "Récupération des informations d'une ou plusieurs collectivités",
  })
  async getCollectivites(@Query() request: ListCollectivitesApiRequestClass) {
    return this.listCollectivitesService.listCollectivites(request, 'public');
  }
}
