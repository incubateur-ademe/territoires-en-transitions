import { ficheActionNoteSchema } from '@/backend/plans/fiches';
import { CountByStatutService } from '@/backend/plans/fiches/count-by-statut/count-by-statut.service';
import { countSyntheseValeurSchema } from '@/backend/utils/count-by.dto';
import { createZodDto } from '@anatine/zod-nestjs';
import { extendApi } from '@anatine/zod-openapi';
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
import {
  deleteFicheActionNotesRequestSchema,
  upsertFicheActionNotesRequestSchema,
} from './shared/upsert-fiche-action-note.request';
import FicheService from './fiche.service';
import FichesActionUpdateService from './fiches-action-update.service';
import { editFicheRequestSchema } from './shared/edit-fiche.request';
import { fetchFichesFilterRequestSchema } from './shared/fetch-fiches-filter.request';

/**
 * Création des classes de réponse à partir du schema pour générer automatiquement la documentation OpenAPI
 */
export class GetFichesActionSyntheseResponseClass extends createZodDto(
  extendApi(
    z.object({
      par_statut: countSyntheseValeurSchema,
    })
  )
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

@ApiTags('Fiches action')
@Controller('collectivites/:collectivite_id/fiches-action')
export class FichesActionController {
  constructor(
    private readonly ficheService: FicheService,
    private readonly fichesActionSyntheseService: CountByStatutService,
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
    @Query() request: GetFichesActionFilterRequestClass,
    @TokenInfo() tokenInfo: AuthenticatedUser
  ) {
    return this.fichesActionSyntheseService.countByStatut(
      collectiviteId,
      request
    );
  }

  @Get('')
  // TODO: type it for documentation
  @ApiOkResponse({
    description: "Récupération des fiches action d'une collectivité",
  })
  async getFichesAction(
    @Param('collectivite_id') collectiviteId: number,
    @Query() request: GetFichesActionFilterRequestClass,
    @TokenInfo() tokenInfo: AuthenticatedUser
  ) {
    return this.fichesActionSyntheseService.getFichesAction(
      collectiviteId,
      request
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
