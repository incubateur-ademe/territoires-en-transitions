import { createZodDto } from '@anatine/zod-nestjs';
import { Body, Controller, Get, Logger, Post, Query } from '@nestjs/common';
import { ApiCreatedResponse, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TokenInfo } from '../../auth/decorators/token-info.decorators';
import type { AuthenticatedUser } from '../../auth/models/auth.models';
import { getIndicateursValeursRequestSchema } from '../models/get-indicateurs.request';
import { getIndicateursValeursResponseSchema } from '../models/get-indicateurs.response';
import {
  UpsertIndicateursValeursRequest,
  UpsertIndicateursValeursResponse,
} from '../models/upsert-indicateurs-valeurs.request';
import CrudValeursService from './crud-valeurs.service';

/**
 * Création des classes de requête/réponse à partir du schema pour générer automatiquement la documentation OpenAPI et la validation des entrées
 */
class GetIndicateursValeursRequestClass extends createZodDto(
  getIndicateursValeursRequestSchema
) {}

class GetIndicateursValeursResponseClass extends createZodDto(
  getIndicateursValeursResponseSchema
) {}

@ApiTags('Indicateurs')
@Controller('indicateurs')
export class IndicateursController {
  private readonly logger = new Logger(IndicateursController.name);

  constructor(private readonly service: CrudValeursService) {}

  @Get()
  @ApiResponse({ type: GetIndicateursValeursResponseClass })
  async getIndicateurValeurs(
    @Query() request: GetIndicateursValeursRequestClass,
    @TokenInfo() tokenInfo: AuthenticatedUser
  ): Promise<GetIndicateursValeursResponseClass> {
    return this.service.getIndicateurValeursGroupees(request, tokenInfo);
  }

  @Post()
  @ApiCreatedResponse({
    type: UpsertIndicateursValeursRequest,
  })
  async upsertIndicateurValeurs(
    @Body() request: UpsertIndicateursValeursRequest,
    @TokenInfo() tokenInfo: AuthenticatedUser
  ): Promise<UpsertIndicateursValeursResponse> {
    const upsertedValeurs = await this.service.upsertIndicateurValeurs(
      request.valeurs,
      tokenInfo
    );
    return { valeurs: upsertedValeurs };
  }
}
