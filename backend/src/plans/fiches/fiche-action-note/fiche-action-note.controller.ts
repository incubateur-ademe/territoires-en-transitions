import { ficheActionNoteSchema } from '@/backend/plans/fiches/index-domain';
import { createZodDto } from '@anatine/zod-nestjs';
import { Body, Controller, Delete, Get, Param, Put } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import {
  deleteFicheActionNotesRequestSchema,
  upsertFicheActionNotesRequestSchema,
} from '@/backend/plans/fiches/fiche-action-note/upsert-fiche-action-note.request';
import { getFichesActionResponseSchema } from '@/backend/plans/fiches/shared/models/get-fiche-actions.response';
import { TokenInfo } from '@/backend/auth/decorators/token-info.decorators';
import { AuthenticatedUser } from '@/backend/auth/models/auth.models';
import FicheActionNoteService from '@/backend/plans/fiches/fiche-action-note/fiche-action-note.service';

/**
 * Création des classes de réponse à partir du schema pour générer automatiquement la documentation OpenAPI
 */

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
export class FicheActionNoteController {
  constructor(private readonly ficheService: FicheActionNoteService) {}

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
    return this.ficheService.upsertNotes(ficheId, body.notes, tokenInfo);
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
    return this.ficheService.deleteNote(ficheId, body.id, tokenInfo);
  }
}
