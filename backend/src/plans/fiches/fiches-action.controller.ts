import FicheActionListService from '@/backend/plans/fiches/fiches-action-list.service';
import { ficheActionNoteSchema } from '@/backend/plans/fiches/index-domain';
import { countSyntheseValeurSchema } from '@/backend/utils/count-by.dto';
import { createZodDto } from '@anatine/zod-nestjs';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { TokenInfo } from '../../auth/decorators/token-info.decorators';
import type { AuthenticatedUser } from '../../auth/models/auth.models';
import { CountByPropertyEnumType } from './count-by/count-by-property-options.enum';
import { CountByService } from './count-by/count-by.service';
import FicheService from './fiche.service';
import FichesActionUpdateService from './fiches-action-update.service';
import { editFicheRequestSchema } from './shared/edit-fiche.request';
import { fetchFichesFilterRequestSchema } from './shared/fetch-fiches-filter.request';
import { getFichesActionResponseSchema } from './shared/models/get-fiche-actions.response';
import {
  deleteFicheActionNotesRequestSchema,
  upsertFicheActionNotesRequestSchema,
} from './shared/upsert-fiche-action-note.request';

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

@ApiTags('Fiches action')
@Controller('collectivites/:collectivite_id/fiches-action')
export class FichesActionController {
  constructor(
    private readonly ficheService: FicheService,
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

  @Get(':id/notes')
  @ApiOkResponse({
    type: GetFicheActionNotesResponseClass,
    description: 'Charge les notes de suivi',
  })
  async selectFicheActionNotes(
    @Param('id') ficheId: number,
    @TokenInfo() tokenInfo: AuthenticatedUser
  ) {
    return this.ficheService.getNotes(ficheId, tokenInfo);
  }

  @Put(':id/notes')
  @ApiOkResponse({
    type: UpsertFicheActionNotesRequestClass,
    description: 'Insère ou met à jour les notes de suivi',
  })
  async upsertFicheActionNotes(
    @Param('id') ficheId: number,
    @Body() body: UpsertFicheActionNotesRequestClass,
    @TokenInfo() tokenInfo: AuthenticatedUser
  ) {
    return this.fichesActionUpdateService.upsertNotes(
      ficheId,
      body.notes,
      tokenInfo
    );
  }

  @Delete(':id/note')
  @ApiOkResponse({
    type: DeleteFicheActionNotesRequestClass,
    description: 'Supprime une note de suivi',
  })
  async deleteFicheActionNotes(
    @Param('id') ficheId: number,
    @Body() body: DeleteFicheActionNotesRequestClass,
    @TokenInfo() tokenInfo: AuthenticatedUser
  ) {
    return this.fichesActionUpdateService.deleteNote(
      ficheId,
      body.id,
      tokenInfo
    );
  }
}
