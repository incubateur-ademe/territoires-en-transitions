import { createZodDto } from '@anatine/zod-nestjs';
import { Body, Controller, Get, Logger, Post, Query } from '@nestjs/common';
import { ApiCreatedResponse, ApiResponse } from '@nestjs/swagger';
import { TokenInfo } from '../../auth/decorators/token-info.decorators';
import type { SupabaseJwtPayload } from '../../auth/models/auth.models';
import {
  getIndicateursValeursRequestSchema,
  getIndicateursValeursResponseSchema,
} from '../models/getIndicateurs.models';
import {
  UpsertIndicateursValeursRequest,
  UpsertIndicateursValeursResponse,
} from '../models/upsertIndicateurs.models';
import IndicateursService from '../services/indicateurs.service';

/**
 * Création des classes de requête/réponse à partir du schema pour générer automatiquement la documentation OpenAPI et la validation des entrées
 */
class GetIndicateursValeursRequestClass extends createZodDto(
  getIndicateursValeursRequestSchema
) {}

class GetIndicateursValeursResponseClass extends createZodDto(
  getIndicateursValeursResponseSchema
) {}

@Controller('indicateurs')
export class IndicateursController {
  private readonly logger = new Logger(IndicateursController.name);

  constructor(private readonly indicateurService: IndicateursService) {}

  @Get()
  @ApiResponse({ type: GetIndicateursValeursResponseClass })
  async getIndicateurValeurs(
    @Query() request: GetIndicateursValeursRequestClass,
    @TokenInfo() tokenInfo: SupabaseJwtPayload
  ): Promise<GetIndicateursValeursResponseClass> {
    return this.indicateurService.getIndicateurValeursGroupees(
      request,
      tokenInfo
    );
  }

  @Post()
  @ApiCreatedResponse({
    type: UpsertIndicateursValeursRequest,
  })
  async upsertIndicateurValeurs(
    @Body() request: UpsertIndicateursValeursRequest,
    @TokenInfo() tokenInfo: SupabaseJwtPayload
  ): Promise<UpsertIndicateursValeursResponse> {
    const upsertedValeurs =
      await this.indicateurService.upsertIndicateurValeurs(
        request.valeurs,
        tokenInfo
      );
    return { valeurs: upsertedValeurs };
  }
}
