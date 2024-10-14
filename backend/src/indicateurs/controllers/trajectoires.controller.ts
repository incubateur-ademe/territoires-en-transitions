import { createZodDto } from '@anatine/zod-nestjs';
import {
  Controller,
  Delete,
  Get,
  Logger,
  Next,
  Query,
  Res,
} from '@nestjs/common';
import { ApiOkResponse, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NextFunction, Response } from 'express';
import { AllowPublicAccess } from '../../auth/decorators/allow-public-access.decorator';
import { TokenInfo } from '../../auth/decorators/token-info.decorators';
import type { SupabaseJwtPayload } from '../../auth/models/auth.models';
import { CollectiviteRequestClass } from '../../collectivites/models/collectivite.request';
import {
  calculTrajectoireRequestSchema,
  calculTrajectoireResponseSchema,
  modeleTrajectoireTelechargementRequestSchema,
  verificationDonneesSNBCResponseSchema,
  verificationTrajectoireRequestSchema,
} from '../models/calcultrajectoire.models';
import TrajectoiresDataService from '../services/trajectoires-data.service';
import TrajectoiresSpreadsheetService from '../services/trajectoires-spreadsheet.service';
import TrajectoiresXlsxService from '../services/trajectoires-xlsx.service';

/**
 * Création des classes de requête/réponse à partir du schema pour générer automatiquement la documentation OpenAPI et la validation des entrées
 */
export class CalculTrajectoireResponseClass extends createZodDto(
  calculTrajectoireResponseSchema
) {}
export class CalculTrajectoireRequestClass extends createZodDto(
  calculTrajectoireRequestSchema
) {}

export class ModeleTrajectoireTelechargementRequestClass extends createZodDto(
  modeleTrajectoireTelechargementRequestSchema
) {}

export class VerificationTrajectoireRequestClass extends createZodDto(
  verificationTrajectoireRequestSchema
) {}
export class VerificationDonneesSNBCResponseClass extends createZodDto(
  verificationDonneesSNBCResponseSchema
) {}

@ApiTags('Trajectoires')
@Controller('trajectoires/snbc')
export class TrajectoiresController {
  private readonly logger = new Logger(TrajectoiresController.name);

  constructor(
    private readonly trajectoiresDataService: TrajectoiresDataService,
    private readonly trajectoiresSpreadsheetService: TrajectoiresSpreadsheetService,
    private readonly trajectoiresXlsxService: TrajectoiresXlsxService
  ) {}

  @Get('')
  @ApiResponse({ type: CalculTrajectoireResponseClass })
  async calculeTrajectoireSnbc(
    @Query() request: CalculTrajectoireRequestClass,
    @TokenInfo() tokenInfo: SupabaseJwtPayload
  ): Promise<CalculTrajectoireResponseClass> {
    this.logger.log(
      `Calcul de la trajectoire SNBC pour la collectivité ${request.collectivite_id}`
    );
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { spreadsheet_id, ...response } =
      await this.trajectoiresSpreadsheetService.calculeTrajectoireSnbc(
        request,
        tokenInfo
      );
    return response;
  }

  @Delete('')
  async deleteTrajectoireSnbc(
    @Query() request: CollectiviteRequestClass,
    @TokenInfo() tokenInfo: SupabaseJwtPayload
  ): Promise<void> {
    this.logger.log(
      `Suppression de la trajectoire SNBC pour la collectivité ${request.collectivite_id}`
    );
    await this.trajectoiresDataService.deleteTrajectoireSnbc(
      request.collectivite_id,
      undefined,
      tokenInfo
    );
  }

  @AllowPublicAccess()
  @Get('modele')
  @ApiOkResponse({
    description:
      'Téléchargement du fichier excel utilisé pour le calcul de la trajectoire SNBC',
  })
  downloadModeleSnbc(
    @Query() request: ModeleTrajectoireTelechargementRequestClass,
    @Res() res: Response,
    @Next() next: NextFunction
  ) {
    this.logger.log(`Téléchargement du modele de trajectoire SNBC`);
    this.trajectoiresXlsxService.downloadModeleTrajectoireSnbc(
      request,
      res,
      next
    );
  }

  @Get('telechargement')
  @ApiOkResponse({
    description:
      'Téléchargement du fichier excel utilisé pour le calcul de la trajectoire SNBC prérempli avec les données de la collectivité',
  })
  downloadDataSnbc(
    @Query() request: CollectiviteRequestClass,
    @TokenInfo() tokenInfo: SupabaseJwtPayload,
    @Res() res: Response,
    @Next() next: NextFunction
  ) {
    this.logger.log(
      `Téléchargement de la trajectoire SNBC pour la collectivité ${request.collectivite_id}`
    );
    this.trajectoiresXlsxService.downloadTrajectoireSnbc(
      request,
      tokenInfo,
      res,
      next
    );
  }

  @Get('verification')
  @ApiOkResponse({
    type: VerificationDonneesSNBCResponseClass,
    description:
      'Status pour savoir si le calcul de la trajectoire SNBC est possible et données qui seront utilisées',
  })
  async verificationDonneesSnbc(
    @Query() request: VerificationTrajectoireRequestClass,
    @TokenInfo() tokenInfo: SupabaseJwtPayload
  ): Promise<VerificationDonneesSNBCResponseClass> {
    this.logger.log(
      `Vérifie la possibilité de lancer le calcul de la trajectoire SNBC pour la collectivité ${request.collectivite_id}`
    );
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { valeurs, ...response } =
      await this.trajectoiresDataService.verificationDonneesSnbc(
        request,
        tokenInfo
      );
    if (!request.epci_info) {
      delete response.epci;
    }
    return response;
  }
}
