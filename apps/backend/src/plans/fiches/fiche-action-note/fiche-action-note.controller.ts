import { Body, Controller, Delete, Get, Param, Put } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExcludeController,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import FicheActionNoteService from '@tet/backend/plans/fiches/fiche-action-note/fiche-action-note.service';
import {
  deleteFicheActionNotesRequestSchema,
  upsertFicheActionNotesRequestSchema,
} from '@tet/backend/plans/fiches/fiche-action-note/upsert-fiche-action-note.request';
import { TokenInfo } from '@tet/backend/users/decorators/token-info.decorators';
import type { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { ApiUsageEnum } from '@tet/backend/utils/api/api-usage-type.enum';
import { ApiUsage } from '@tet/backend/utils/api/api-usage.decorator';
import { ficheNoteSchema } from '@tet/domain/plans';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * Création des classes de réponse à partir du schema pour générer automatiquement la documentation OpenAPI
 */

export class GetFicheActionNotesResponseClass extends createZodDto(
  z.array(ficheNoteSchema)
) {}

export class UpsertFicheActionNotesRequestClass extends createZodDto(
  upsertFicheActionNotesRequestSchema
) {}

export class DeleteFicheActionNotesRequestClass extends createZodDto(
  deleteFicheActionNotesRequestSchema
) {}

@ApiExcludeController()
@ApiTags('Fiches action')
@ApiBearerAuth()
@Controller('collectivites/:collectivite_id/fiches-action')
export class FicheActionNoteController {
  constructor(private readonly ficheService: FicheActionNoteService) {}

  @Get(':id/notes')
  @ApiUsage([ApiUsageEnum.APP])
  @ApiOkResponse({
    type: GetFicheActionNotesResponseClass,
    description: 'Charge les notes',
  })
  async selectFicheActionNotes(
    @Param('id') ficheId: number,
    @TokenInfo() tokenInfo: AuthenticatedUser
  ) {
    return this.ficheService.getNotes(ficheId, tokenInfo);
  }

  @Put(':id/notes')
  @ApiUsage([ApiUsageEnum.APP])
  @ApiOkResponse({
    type: UpsertFicheActionNotesRequestClass,
    description: 'Insère ou met à jour les notes',
  })
  async upsertFicheActionNotes(
    @Param('id') ficheId: number,
    @Body() body: UpsertFicheActionNotesRequestClass,
    @TokenInfo() tokenInfo: AuthenticatedUser
  ) {
    return this.ficheService.upsertNotes(ficheId, body.notes, tokenInfo);
  }

  @Delete(':id/note')
  @ApiUsage([ApiUsageEnum.APP])
  @ApiOkResponse({
    type: DeleteFicheActionNotesRequestClass,
    description: 'Supprime une note',
  })
  async deleteFicheActionNotes(
    @Param('id') ficheId: number,
    @Body() body: DeleteFicheActionNotesRequestClass,
    @TokenInfo() tokenInfo: AuthenticatedUser
  ) {
    return this.ficheService.deleteNote(ficheId, body.id, tokenInfo);
  }
}
