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
import { TokenInfo } from '../../auth/decorators/token-info.decorators';
import type { AuthenticatedUser } from '../../auth/models/auth.models';
import { getFichesActionSyntheseSchema } from '../models/get-fiches-action-synthese.response';
import { getFichesActionFilterRequestSchema } from '../models/get-fiches-actions-filter.request';
import { updateFicheActionRequestSchema } from '../models/update-fiche-action.request';
import { CountByStatutService } from '../count-by-statut/count-by-statut.service';
import FichesActionUpdateService from '../services/fiches-action-update.service';
import {
  deleteFicheActionNotesRequestSchema,
  upsertFicheActionNotesRequestSchema,
} from '../models/upsert-fiche-action-note.request';
import FicheService from '../services/fiche.service';
import { ficheActionNoteSchema } from '../models/fiche-action-note.table';
import { z } from 'zod';

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
      body.dateNote,
      tokenInfo
    );
  }
}
