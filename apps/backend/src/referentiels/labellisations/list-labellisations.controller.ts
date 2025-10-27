import { listCollectiviteApiRequestSchema } from '@/backend/collectivites/list-collectivites/list-collectivites.api-request';
import { listLabellisationApiResponseSchema } from '@/backend/referentiels/labellisations/list-labellisations.api-response';
import { ListLabellisationsService } from '@/backend/referentiels/labellisations/list-labellisations.service';
import { AllowAnonymousAccess } from '@/backend/users/decorators/allow-anonymous-access.decorator';
import { ApiUsageEnum } from '@/backend/utils/api/api-usage-type.enum';
import { ApiUsage } from '@/backend/utils/api/api-usage.decorator';
import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';

/**
 * Création des classes de réponse à partir du schema pour générer automatiquement la documentation OpenAPI
 */
export class ListLabellisationsApiRequestClass extends createZodDto(
  listCollectiviteApiRequestSchema
) {}

export class ListLabellisationsApiResponseClass extends createZodDto(
  listLabellisationApiResponseSchema
) {}

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
    type: ListLabellisationsApiResponseClass,
    description:
      "Récupération les labellisations d'une ou plusieurs collectivités",
  })
  async getCollectivitesLabellisations(
    @Query() request: ListLabellisationsApiRequestClass
  ) {
    return this.listLabellisationService.listCollectiviteLabellisations(
      request
    );
  }
}
