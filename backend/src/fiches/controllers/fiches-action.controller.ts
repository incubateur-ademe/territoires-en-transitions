import { createZodDto } from '@anatine/zod-nestjs';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { TokenInfo } from '../../auth/decorators/token-info.decorators';
import { getFichesActionSyntheseSchema } from '../models/get-fiches-action-synthese.response';
import { getFichesActionFilterRequestSchema } from '../models/get-fiches-actions-filter.request';
import FichesActionSyntheseService from '../services/fiches-action-synthese.service';
import type { SupabaseJwtPayload } from '../../auth/models/supabase-jwt.models';

/**
 * Création des classes de réponse à partir du schema pour générer automatiquement la documentation OpenAPI
 */
export class GetFichesActionSyntheseResponseClass extends createZodDto(
  getFichesActionSyntheseSchema
) {}

export class GetFichesActionFilterRequestClass extends createZodDto(
  getFichesActionFilterRequestSchema
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
}
