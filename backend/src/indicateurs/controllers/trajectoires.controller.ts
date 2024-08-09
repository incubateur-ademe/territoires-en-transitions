import { Body, Controller, Get, Logger, Post, Query } from '@nestjs/common';
import CalculTrajectoireRequest from '../models/calcultrajectoire.request';
import TrajectoiresService from '../service/trajectoires.service';

@Controller('trajectoires')
export class TrajectoiresController {
  private readonly logger = new Logger(TrajectoiresController.name);

  constructor(private readonly trajectoiresService: TrajectoiresService) {}

  @Get('snbc') // TODO: laisser uniquement le POST?
  calculeTrajectoireSnbc(@Query() request: CalculTrajectoireRequest) {
    this.logger.log(
      `Calcul de la trajectoire SNBC pour la collectivité ${request.collectivite_id}`,
    );
    return this.trajectoiresService.calculeTrajectoireSnbc(request);
  }

  @Post('snbc')
  postCalculeTrajectoireSnbc(@Body() request: CalculTrajectoireRequest) {
    this.logger.log(
      `Calcul de la trajectoire SNBC pour la collectivité ${request.collectivite_id}`,
    );
    return this.trajectoiresService.calculeTrajectoireSnbc(request);
  }
}
