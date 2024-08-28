import { Controller, Get, Logger, Next, Query, Res } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { NextFunction, Response } from 'express';
import { PublicEndpoint } from '../../auth/decorators/public-endpoint.decorator';
import { TokenInfo } from '../../auth/decorators/token-info.decorators';
import { SupabaseJwtPayload } from '../../auth/models/auth.models';
import CollectiviteRequest from '../../collectivites/models/collectivite.request';
import {
  CalculTrajectoireRequest,
  CalculTrajectoireResponse,
  ModeleTrajectoireTelechargementRequest,
  VerificationTrajectoireRequest,
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
    @TokenInfo() tokenInfo: SupabaseJwtPayload,
  ): Promise<CalculTrajectoireResponse> {
    this.logger.log(
      `Calcul de la trajectoire SNBC pour la collectivité ${request.collectivite_id}`,
    );
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { spreadsheet_id, ...response } =
      await this.trajectoiresService.calculeTrajectoireSnbc(request, tokenInfo);
    return response;
  }

  @PublicEndpoint()
  @Get('snbc/modele')
  downloadModeleSnbc(
    @Query() request: ModeleTrajectoireTelechargementRequest,
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    this.logger.log(`Téléchargement du modele de trajectoire SNBC`);
    this.trajectoiresService.downloadModeleTrajectoireSnbc(request, res, next);
  }

  @Get('snbc/telechargement')
  downloadDataSnbc(
    @Query() request: CollectiviteRequest,
    @TokenInfo() tokenInfo: SupabaseJwtPayload,
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    this.logger.log(
      `Téléchargement de la trajectoire SNBC pour la collectivité ${request.collectivite_id}`,
    );
    this.trajectoiresService.downloadTrajectoireSnbc(
      request,
      tokenInfo,
      res,
      next,
    );
  }

  @Get('snbc/verification')
  async verificationDonneesSnbc(
    @Query() request: VerificationTrajectoireRequest,
    @TokenInfo() tokenInfo: SupabaseJwtPayload,
  ) {
    this.logger.log(
      `Vérifie la possibilité de lancer le calcul de la trajectoire SNBC pour la collectivité ${request.collectivite_id}`,
    );
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { epci, valeurs, ...response } =
      await this.trajectoiresService.verificationDonneesSnbc(
        request,
        tokenInfo,
      );
    return response;
  }
}
