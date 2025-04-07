import { countSyntheseValeurSchema } from '@/backend/utils/count-by.dto';
import FicheActionListService from '@/backend/plans/fiches/fiches-action-list.service';
import { createZodDto } from '@anatine/zod-nestjs';
import { Body, Controller, Get, Param, Put, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { TokenInfo } from '../../auth/decorators/token-info.decorators';
import type { AuthenticatedUser } from '../../auth/models/auth.models';
import { CountByPropertyEnumType } from './count-by/count-by-property-options.enum';
import { CountByService } from './count-by/count-by.service';
import FicheActionPermissionsService from './fiche-action-permissions.service';
import FichesActionUpdateService from './fiches-action-update.service';
import { editFicheRequestSchema } from './shared/edit-fiche.request';
import { fetchFichesFilterRequestSchema } from './shared/fetch-fiches-filter.request';
import { GetFichesActionResponseClass } from '@/backend/plans/fiches/fiche-action-note/fiche-action-note.controller';

/**
 * Création des classes de réponse à partir du schema pour générer automatiquement la documentation OpenAPI
 */
export class GetFichesActionSyntheseResponseClass extends createZodDto(
  z.object({
    par_statut: countSyntheseValeurSchema,
  })
) {}

export class GetFichesActionFilterRequestClass extends createZodDto(
  fetchFichesFilterRequestSchema
) {}

export class UpdateFicheActionRequestClass extends createZodDto(
  editFicheRequestSchema.refine(
    (schema) => Object.keys(schema).length > 0,
    'Body cannot be empty'
  )
) {}

@ApiTags('Fiches action')
@Controller('collectivites/:collectivite_id/fiches-action')
export class FichesActionController {
  constructor(
    private readonly ficheService: FicheActionPermissionsService,
    private readonly fichesActionSyntheseService: CountByService,
    private readonly ficheActionListService: FicheActionListService,
    private readonly fichesActionUpdateService: FichesActionUpdateService
  ) {}

  @Get('count-by/:countByProperty')
  @ApiOkResponse({
    type: GetFichesActionSyntheseResponseClass,
    description:
      "Récupération de la synthèse des fiches action d'une collectivité (ex: nombre par statut)",
  })
  async getFichesActionSynthese(
    @Param('collectivite_id') collectiviteId: number,
    @Param('countByProperty') countByProperty: string,
    @Query() request: GetFichesActionFilterRequestClass,
    @TokenInfo() tokenInfo: AuthenticatedUser
  ) {
    return this.fichesActionSyntheseService.countByProperty(
      collectiviteId,
      countByProperty as CountByPropertyEnumType,
      request
    );
  }

  @Get('')
  @ApiOkResponse({
    description: "Récupération des fiches action d'une collectivité",
    type: GetFichesActionResponseClass,
  })
  async getFichesAction(
    @Param('collectivite_id') collectiviteId: number,
    @Query() request: GetFichesActionFilterRequestClass,
    @TokenInfo() tokenInfo: AuthenticatedUser
  ): Promise<GetFichesActionResponseClass> {
    const fiches = await this.ficheActionListService.getFichesAction(
      collectiviteId,
      request
    );
    return { count: fiches.length, data: fiches };
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
    @TokenInfo() tokenInfo: AuthenticatedUser
  ) {
    return await this.fichesActionUpdateService.updateFicheAction(
      id,
      body,
      tokenInfo
    );
  }
}
