import { Controller, Get, Logger, Query, Res } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import CollectiviteRequest from '../../collectivites/models/collectivite.request';
import {
  CalculTrajectoireRequest,
  CalculTrajectoireResponse,
} from '../models/calcultrajectoire.models';
import TrajectoiresService from '../service/trajectoires.service';

@Controller('trajectoires')
export class TrajectoiresController {
  private readonly logger = new Logger(TrajectoiresController.name);

  constructor(private readonly trajectoiresService: TrajectoiresService) {}

  @Get('snbc')
  @ApiResponse({ type: CalculTrajectoireResponse })
  async calculeTrajectoireSnbc(
    @Query() request: CalculTrajectoireRequest,
  ): Promise<CalculTrajectoireResponse> {
    this.logger.log(
      `Calcul de la trajectoire SNBC pour la collectivité ${request.collectivite_id}`,
    );
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { spreadsheet_id, ...response } =
      await this.trajectoiresService.calculeTrajectoireSnbc(request);
    return response;
  }

  @Get('snbc/telechargement')
  downloadDataSnbc(
    @Query() request: CollectiviteRequest,
    @Res() res: Response,
  ) {
    this.logger.log(
      `Téléchargement de la trajectoire SNBC pour la collectivité ${request.collectivite_id}`,
    );
    return this.trajectoiresService.downloadTrajectoireSnbc(request, res);
  }

  @Get('snbc/verification')
  async verificationDonneesSnbc(@Query() request: CollectiviteRequest) {
    this.logger.log(
      `Vérifie la possibilité de lancer le calcul de la trajectoire SNBC pour la collectivité ${request.collectivite_id}`,
    );
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { epci, valeurs, ...response } =
      await this.trajectoiresService.verificationDonneesSnbc(request);
    return response;
  }
}
