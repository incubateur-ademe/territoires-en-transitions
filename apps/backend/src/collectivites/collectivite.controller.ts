import { listCollectiviteApiRequestSchema } from '@/backend/collectivites/list-collectivites/list-collectivites.api-request';
import { listCollectiviteApiResponseSchema } from '@/backend/collectivites/list-collectivites/list-collectivites.api-response';
import ListCollectivitesService from '@/backend/collectivites/list-collectivites/list-collectivites.service';
import { AllowAnonymousAccess } from '@/backend/users/decorators/allow-anonymous-access.decorator';
import { ApiUsageEnum } from '@/backend/utils/api/api-usage-type.enum';
import { ApiUsage } from '@/backend/utils/api/api-usage.decorator';
import { createZodDto } from '@anatine/zod-nestjs';
import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

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
    type: ListCollectivitesApiResponseClass,
    description: "Informations d'une ou plusieurs collectivités",
  })
  async getCollectivites(@Query() request: ListCollectivitesApiRequestClass) {
    if (!request.fieldsMode) {
      request.fieldsMode = 'public';
    }
    return this.listCollectivitesService.listCollectivites(request);
  }
}
