import { Controller, Get, Logger, Query } from '@nestjs/common';
import CalculTrajectoireRequest from '../models/calcultrajectoire.request';
import TrajectoiresService from '../service/trajectoires.service';

@Controller('trajectoires')
export class TrajectoiresController {
  private readonly logger = new Logger(TrajectoiresController.name);

  constructor(private readonly trajectoiresService: TrajectoiresService) {}

  @Get('snbc') // TODO: plutôt un post
  calculeTrajectoireSnbc(@Query() request: CalculTrajectoireRequest) {
    this.logger.log(
      `Calcul de la trajectoire SNBC pour la collectivité ${request.collectivite_id}`,
    );
    return this.trajectoiresService.calculeTrajectoireSnbc(request);
  }
}
