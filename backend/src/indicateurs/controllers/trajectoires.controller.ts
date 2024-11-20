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
import { User } from '../../auth/decorators/user.decorator';
import type { AuthenticatedUser } from '../../auth/models/authenticated-user.models';
import { CollectiviteRequestClass } from '../../collectivites/models/collectivite.request';
import { calculTrajectoireRequestSchema } from '../models/calcul-trajectoire.request';
import { calculTrajectoireResponseSchema } from '../models/calcul-trajectoire.response';
import { modeleTrajectoireTelechargementRequestSchema } from '../models/modele-trajectoire-telechargement.request';
import { verificationTrajectoireRequestSchema } from '../models/verification-trajectoire.request';
import { verificationTrajectoireResponseSchema } from '../models/verification-trajectoire.response';
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
    @User() user: AuthenticatedUser
  ): Promise<CalculTrajectoireResponseClass> {
    this.logger.log(
      `Calcul de la trajectoire SNBC pour la collectivité ${request.collectiviteId}`
    );
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { spreadsheetId, ...response } =
      await this.trajectoiresSpreadsheetService.calculeTrajectoireSnbc(
        request,
        user
      );
    return response;
  }

  @Delete('')
  async deleteTrajectoireSnbc(
    @Query() request: CollectiviteRequestClass,
    @User() user: AuthenticatedUser
  ): Promise<void> {
    this.logger.log(
      `Suppression de la trajectoire SNBC pour la collectivité ${request.collectiviteId}`
    );
    await this.trajectoiresDataService.deleteTrajectoireSnbc(
      request.collectiviteId,
      undefined,
      user
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
    @User() user: AuthenticatedUser,
    @Res() res: Response,
    @Next() next: NextFunction
  ) {
    this.logger.log(
      `Téléchargement de la trajectoire SNBC pour la collectivité ${request.collectiviteId}`
    );
    this.trajectoiresXlsxService.downloadTrajectoireSnbc(
      request,
      user,
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
    @User() user: AuthenticatedUser
  ): Promise<VerificationTrajectoireResponseClass> {
    this.logger.log(
      `Vérifie la possibilité de lancer le calcul de la trajectoire SNBC pour la collectivité ${request.collectiviteId}`
    );
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { valeurs, ...response } =
      await this.trajectoiresDataService.verificationDonneesSnbc(request, user);
    if (!request.epciInfo) {
      delete response.epci;
    }
    return response;
  }
}
