import { AllowPublicAccess } from '@/backend/auth';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';
import { CollectivitesService } from '../services/collectivites.service';

/**
 * Création des classes de réponse à partir du schema pour générer automatiquement la documentation OpenAPI
 */
//export class VersionResponseClass extends createZodDto(versionResponseSchema) {}

@Controller()
export class CollectiviteController {
  constructor(private readonly collectiviteService: CollectivitesService) {}

  @AllowPublicAccess()
  @Get('collectivites/:collectivite_id')
  @ApiOkResponse({
    //type: VersionResponseClass,
    description: "Récupération des informations d'une collectivite",
  })
  async getCollectivite(
    @Param('collectivite_id') collectiviteId: number,
    @Query('avecType') avecType: string
  ) {
    if (avecType) {
      return this.collectiviteService.getCollectiviteAvecType(collectiviteId);
    } else {
      return this.collectiviteService.getCollectivite(collectiviteId);
    }
  }
}
