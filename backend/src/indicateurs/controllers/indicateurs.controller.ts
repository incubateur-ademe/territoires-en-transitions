import { Controller, Get, Logger, Query } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import {
  GetIndicateursValeursRequest,
  GetIndicateursValeursResponse,
} from '../models/getIndicateurs.models';
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
}
