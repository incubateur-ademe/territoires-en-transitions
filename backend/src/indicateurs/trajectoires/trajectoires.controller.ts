import { createZodDto } from '@anatine/zod-nestjs';
import { extendApi } from '@anatine/zod-openapi';
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
import type { AuthenticatedUser } from '../../auth/models/auth.models';
import { CollectiviteRequestClass } from '../../collectivites/collectivite.request';
import { calculTrajectoireRequestSchema } from './calcul-trajectoire.request';
import { calculTrajectoireResponseSchema } from './calcul-trajectoire.response';
import { modeleTrajectoireTelechargementRequestSchema } from './modele-trajectoire-telechargement.request';
import TrajectoiresDataService from './trajectoires-data.service';
import TrajectoiresSpreadsheetService from './trajectoires-spreadsheet.service';
import TrajectoiresXlsxService from './trajectoires-xlsx.service';
import { verificationTrajectoireRequestSchema } from './verification-trajectoire.request';
import { verificationTrajectoireResponseSchema } from './verification-trajectoire.response';

/**
 * Création des classes de requête/réponse à partir du schema pour générer automatiquement la documentation OpenAPI et la validation des entrées
 */
export class CalculTrajectoireResponseClass extends createZodDto(
  extendApi(calculTrajectoireResponseSchema)
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

export class VerificationTrajectoireResponseClass extends createZodDto(
  verificationTrajectoireResponseSchema
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
    @TokenInfo() tokenInfo: AuthenticatedUser
  ): Promise<CalculTrajectoireResponseClass> {
    this.logger.log(
      `Calcul de la trajectoire SNBC pour la collectivité ${request.collectiviteId}`
    );
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { spreadsheetId, ...response } =
      await this.trajectoiresSpreadsheetService.calculeTrajectoireSnbc(
        request,
        tokenInfo
      );
    return response;
  }

  @Delete('')
  async deleteTrajectoireSnbc(
    @Query() request: CollectiviteRequestClass,
    @TokenInfo() tokenInfo: AuthenticatedUser
  ): Promise<void> {
    this.logger.log(
      `Suppression de la trajectoire SNBC pour la collectivité ${request.collectiviteId}`
    );
    await this.trajectoiresDataService.deleteTrajectoireSnbc(
      request.collectiviteId,
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
    @TokenInfo() tokenInfo: AuthenticatedUser,
    @Res() res: Response,
    @Next() next: NextFunction
  ) {
    this.logger.log(
      `Téléchargement de la trajectoire SNBC pour la collectivité ${request.collectiviteId}`
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
    type: VerificationTrajectoireResponseClass,
    description:
      'Status pour savoir si le calcul de la trajectoire SNBC est possible et données qui seront utilisées',
  })
  async verificationDonneesSnbc(
    @Query() request: VerificationTrajectoireRequestClass,
    @TokenInfo() tokenInfo: AuthenticatedUser
  ): Promise<VerificationTrajectoireResponseClass> {
    this.logger.log(
      `Vérifie la possibilité de lancer le calcul de la trajectoire SNBC pour la collectivité ${request.collectiviteId}`
    );
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { valeurs, ...response } =
      await this.trajectoiresDataService.verificationDonneesSnbc(
        request,
        tokenInfo,
        undefined,
        undefined,
        true
      );
    if (!request.epciInfo) {
      delete response.epci;
    }
    return response;
  }
}
