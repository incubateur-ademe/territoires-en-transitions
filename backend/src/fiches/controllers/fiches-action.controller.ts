import { createZodDto } from '@anatine/zod-nestjs';
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { TokenInfo } from '../../auth/decorators/token-info.decorators';
import { SupabaseJwtPayload } from '../../auth/models/auth.models';
import { getFichesActionSyntheseSchema } from '../models/get-fiches-action-synthese.response';
import { getFichesActionFilterRequestSchema } from '../models/get-fiches-actions-filter.request';
import FichesActionSyntheseService from '../services/fiches-action-synthese.service';
import { CreateFicheActionType } from '../models/fiche-action.table';
import { PublicEndpoint } from 'backend/src/auth/decorators/public-endpoint.decorator';
import { upsertFicheActionRequestSchema } from '../models/upsert-fiche-action.request';

/**
 * Création des classes de réponse à partir du schema pour générer automatiquement la documentation OpenAPI
 */
export class GetFichesActionSyntheseResponseClass extends createZodDto(
  getFichesActionSyntheseSchema
) {}
export class GetFichesActionFilterRequestClass extends createZodDto(
  getFichesActionFilterRequestSchema
) {}
export class UpsertFicheActionRequestClass extends createZodDto(
  upsertFicheActionRequestSchema
) {}

@ApiTags('Fiches action')
@Controller('collectivites/:collectivite_id/fiches-action')
export class FichesActionController {
  constructor(
    private readonly fichesActionSyntheseService: FichesActionSyntheseService
  ) {}

  @Get('synthese')
  @ApiOkResponse({
    type: GetFichesActionSyntheseResponseClass,
    description:
      "Récupération de la sythèse des fiches action d'une collectivité (ex: nombre par statut)",
  })
  async getFichesActionSynthese(
    @Param('collectivite_id') collectiviteId: number,
    @Query() request: GetFichesActionFilterRequestClass,
    @TokenInfo() tokenInfo: SupabaseJwtPayload
  ) {
    return this.fichesActionSyntheseService.getFichesActionSynthese(
      collectiviteId,
      request,
      tokenInfo
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
    @TokenInfo() tokenInfo: SupabaseJwtPayload
  ) {
    return this.fichesActionSyntheseService.getFichesAction(
      collectiviteId,
      request,
      tokenInfo
    );
  }

  @PublicEndpoint()
  @Post('')
  // TODO: type it for documentation
  @ApiOkResponse({
    description: "Récupération des fiches action d'une collectivité",
  })
  async upsertFichesAction(
    @Param('collectivite_id') collectiviteId: number,
    @Body() body: UpsertFicheActionRequestClass,
    @TokenInfo() tokenInfo: SupabaseJwtPayload
  ) {
    return this.fichesActionSyntheseService.upsertFicheAction(
      collectiviteId,
      body,
      tokenInfo
    );
  }
}
