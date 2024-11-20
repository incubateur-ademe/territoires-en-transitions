import { createZodDto } from '@anatine/zod-nestjs';
import { Body, Controller, Get, Param, Put, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { User } from '../../auth/decorators/user.decorator';
import type { AuthenticatedUser } from '../../auth/models/authenticated-user.models';
import { getFichesActionSyntheseSchema } from '../models/get-fiches-action-synthese.response';
import { getFichesActionFilterRequestSchema } from '../models/get-fiches-actions-filter.request';
import { updateFicheActionRequestSchema } from '../models/update-fiche-action.request';
import CountByService from '../services/count-by.service';
import FichesActionUpdateService from '../services/fiches-action-update.service';

/**
 * Création des classes de réponse à partir du schema pour générer automatiquement la documentation OpenAPI
 */
export class GetFichesActionSyntheseResponseClass extends createZodDto(
  getFichesActionSyntheseSchema
) {}

export class GetFichesActionFilterRequestClass extends createZodDto(
  getFichesActionFilterRequestSchema
) {}
export class UpdateFicheActionRequestClass extends createZodDto(
  updateFicheActionRequestSchema
) {}

@ApiTags('Fiches action')
@Controller('collectivites/:collectivite_id/fiches-action')
export class FichesActionController {
  constructor(
    private readonly syntheseService: CountByService,
    private readonly fichesActionUpdateService: FichesActionUpdateService
  ) {}

  @Get('synthese')
  @ApiOkResponse({
    type: GetFichesActionSyntheseResponseClass,
    description:
      "Récupération de la synthèse des fiches action d'une collectivité (ex: nombre par statut)",
  })
  async getFichesActionSynthese(
    @Param('collectivite_id') collectiviteId: number,
    @Query() request: GetFichesActionFilterRequestClass
  ) {
    return this.syntheseService.countByStatut(collectiviteId, request);
  }

  @Get('')
  // TODO: type it for documentation
  @ApiOkResponse({
    description: "Récupération des fiches action d'une collectivité",
  })
  async getFichesAction(
    @Param('collectivite_id') collectiviteId: number,
    @Query() request: GetFichesActionFilterRequestClass
  ) {
    return this.syntheseService.getFichesAction(collectiviteId, request);
  }

  @Put(':id')
  @ApiOkResponse({
    type: UpdateFicheActionRequestClass,
    description: "Mise à jour d'une fiche action",
  })
  async updateFicheAction(
    @Param('id') id: number,
    @Body()
    body: UpdateFicheActionRequestClass,
    @User() user: AuthenticatedUser
  ) {
    return await this.fichesActionUpdateService.updateFicheAction(
      id,
      body,
      user
    );
  }
}
