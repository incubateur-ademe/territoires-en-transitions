import { Body, Controller, Get, Logger, Post, Query } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { TokenInfo } from '../../auth/decorators/token-info.decorators';
import { SupabaseJwtPayload } from '../../auth/models/auth.models';
import {
  GetIndicateursValeursRequest,
  GetIndicateursValeursResponse,
} from '../models/getIndicateurs.models';
import {
  UpsertIndicateursValeursRequest,
  UpsertIndicateursValeursResponse,
} from '../models/upsertIndicateurs.models';
import IndicateursService from '../service/indicateurs.service';

@Controller('indicateurs')
export class IndicateursController {
  private readonly logger = new Logger(IndicateursController.name);

  constructor(private readonly indicateurService: IndicateursService) {}

  @Get()
  @ApiResponse({ type: GetIndicateursValeursResponse })
  async getIndicateurValeurs(
    @Query() request: GetIndicateursValeursRequest,
  ): Promise<GetIndicateursValeursResponse> {
    return this.indicateurService.getIndicateurValeursGroupees(request);
  }

  @Post()
  async upsertIndicateurValeurs(
    @Body() request: UpsertIndicateursValeursRequest,
    @TokenInfo() tokenInfo: SupabaseJwtPayload,
  ): Promise<UpsertIndicateursValeursResponse> {
    const upsertedValeurs =
      await this.indicateurService.upsertIndicateurValeurs(
        request.valeurs,
        tokenInfo.sub,
      );
    return { valeurs: upsertedValeurs };
  }
}
