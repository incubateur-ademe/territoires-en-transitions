import { Body, Controller, Get, Logger, Post, Query } from '@nestjs/common';
import { ApiCreatedResponse, ApiResponse } from '@nestjs/swagger';
import { TokenInfo } from '../../auth/decorators/token-info.decorators';
import { SupabaseJwtPayload } from '../../auth/models/auth.models';
import {
  GetIndicateursValeursRequestClass,
  GetIndicateursValeursResponse,
} from '../models/getIndicateurs.models';
import {
  UpsertIndicateursValeursRequest,
  UpsertIndicateursValeursResponse,
} from '../models/upsertIndicateurs.models';
import IndicateursService from '../services/indicateurs.service';

@Controller('indicateurs')
export class IndicateursController {
  private readonly logger = new Logger(IndicateursController.name);

  constructor(private readonly indicateurService: IndicateursService) {}

  @Get()
  @ApiResponse({ type: GetIndicateursValeursResponse })
  async getIndicateurValeurs(
    @Query() request: GetIndicateursValeursRequestClass,
    @TokenInfo() tokenInfo: SupabaseJwtPayload,
  ): Promise<GetIndicateursValeursResponse> {
    return this.indicateurService.getIndicateurValeursGroupees(
      request,
      tokenInfo,
    );
  }

  @Post()
  @ApiCreatedResponse({
    type: UpsertIndicateursValeursRequest,
  })
  async upsertIndicateurValeurs(
    @Body() request: UpsertIndicateursValeursRequest,
    @TokenInfo() tokenInfo: SupabaseJwtPayload,
  ): Promise<UpsertIndicateursValeursResponse> {
    const upsertedValeurs =
      await this.indicateurService.upsertIndicateurValeurs(
        request.valeurs,
        tokenInfo,
      );
    return { valeurs: upsertedValeurs };
  }
}
