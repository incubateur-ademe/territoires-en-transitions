import { GetFichesActionResponseClass } from '@/backend/plans/fiches/fiche-action-note/fiche-action-note.controller';
import FicheActionListService from '@/backend/plans/fiches/fiches-action-list.service';
import { ApiUsageEnum } from '@/backend/utils/api/api-usage-type.enum';
import { ApiUsage } from '@/backend/utils/api/api-usage.decorator';
import { countSyntheseValeurSchema } from '@/backend/utils/count-by.dto';
import { createZodDto } from '@anatine/zod-nestjs';
import { Body, Controller, Get, Param, Put, Query } from '@nestjs/common';
import { ApiExcludeController, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { TokenInfo } from '../../auth/decorators/token-info.decorators';
import type { AuthenticatedUser } from '../../auth/models/auth.models';
import { CountByService } from './count-by/count-by.service';
import FicheActionPermissionsService from './fiche-action-permissions.service';
import FichesActionUpdateService from './fiches-action-update.service';
import { editFicheRequestSchema } from './shared/edit-fiche.request';
import { fetchFichesFilterRequestSchema } from './shared/fetch-fiches-filter.request';

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

@ApiExcludeController() // TODO: do not exclude when cleaned
@ApiTags('Fiches action')
@Controller('collectivites/:collectivite_id/fiches-action')
export class FichesActionController {
  constructor(
    private readonly ficheService: FicheActionPermissionsService,
    private readonly fichesActionSyntheseService: CountByService,
    private readonly ficheActionListService: FicheActionListService,
    private readonly fichesActionUpdateService: FichesActionUpdateService
  ) {}

  // TODO: to be exposed
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

  // TODO: to be exposed
  @Put(':id')
  @ApiUsage([ApiUsageEnum.APP])
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
