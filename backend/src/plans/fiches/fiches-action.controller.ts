import { ficheActionNoteSchema } from '@/backend/plans/fiches/fiche-action-note/fiche-action-note.table';
import {
  deleteFicheActionNotesRequestSchema,
  upsertFicheActionNotesRequestSchema,
} from '@/backend/plans/fiches/fiche-action-note/upsert-fiche-action-note.request';
import FicheActionListService from '@/backend/plans/fiches/fiches-action-list.service';
import { countSyntheseValeurSchema } from '@/backend/utils/count-by.dto';
import { LIMIT_DEFAULT, PAGE_DEFAULT } from '@/backend/utils/pagination.schema';
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
import {
  getFichesRequestSchema,
  getFilteredFichesRequestSchema,
} from './shared/get-fiches-filter.request';
import {
  getFichesActionResponseSchema,
  getFichesActionResumeResponseSchema,
} from './shared/models/get-fiche-actions.response';

/**
 * Création des classes de réponse à partir du schema pour générer automatiquement la documentation OpenAPI
 */
export class GetFichesActionSyntheseResponseClass extends createZodDto(
  z.object({
    par_statut: countSyntheseValeurSchema,
  })
) {}

export class GetFichesActionFilterRequestClass extends createZodDto(
  getFilteredFichesRequestSchema
) {}

export class UpdateFicheActionRequestClass extends createZodDto(
  editFicheRequestSchema.refine(
    (schema) => Object.keys(schema).length > 0,
    'Body cannot be empty'
  )
) {}

export class GetFicheActionNotesResponseClass extends createZodDto(
  z.array(ficheActionNoteSchema)
) {}
export class UpsertFicheActionNotesRequestClass extends createZodDto(
  upsertFicheActionNotesRequestSchema
) {}
export class DeleteFicheActionNotesRequestClass extends createZodDto(
  deleteFicheActionNotesRequestSchema
) {}

export class GetFichesActionResponseClass extends createZodDto(
  getFichesActionResponseSchema
) {}

export class GetFichesActionResumeResponseClass extends createZodDto(
  getFichesActionResumeResponseSchema
) {}

export class GetFichesResumeRequestClass extends createZodDto(
  getFichesRequestSchema.omit({ collectiviteId: true })
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
    @Query() request: GetFichesResumeRequestClass,
    @TokenInfo() tokenInfo: AuthenticatedUser
  ): Promise<GetFichesActionResponseClass> {
    const { filters, queryOptions } = request;

    return await this.ficheActionListService.getFichesActionWithCount(
      collectiviteId,
      filters,
      {
        page: queryOptions?.page ?? PAGE_DEFAULT,
        limit: queryOptions?.limit ?? LIMIT_DEFAULT,
        sort: queryOptions?.sort,
      }
    );
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
