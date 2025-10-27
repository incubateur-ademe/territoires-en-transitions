import { collectiviteIdInputSchemaCoerce } from '@/backend/collectivites/collectivite-id.input';
import TrajectoiresSpreadsheetService from '@/backend/indicateurs/trajectoires/trajectoires-spreadsheet.service';
import { ApiUsageEnum } from '@/backend/utils/api/api-usage-type.enum';
import { ApiUsage } from '@/backend/utils/api/api-usage.decorator';
import { Controller, Get, Logger, Next, Query, Res } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { NextFunction, Response } from 'express';
import { createZodDto } from 'nestjs-zod';
import { AllowPublicAccess } from '../../users/decorators/allow-public-access.decorator';
import { TokenInfo } from '../../users/decorators/token-info.decorators';
import type { AuthenticatedUser } from '../../users/models/auth.models';
import { calculTrajectoireRequestSchema } from './calcul-trajectoire.request';
import { calculTrajectoireResponseSchema } from './calcul-trajectoire.response';
import { modeleTrajectoireTelechargementRequestSchema } from './modele-trajectoire-telechargement.request';
import TrajectoiresXlsxService from './trajectoires-xlsx.service';
import { verificationTrajectoireRequestSchema } from './verification-trajectoire.request';
import { verificationTrajectoireResponseSchema } from './verification-trajectoire.response';

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

export class CollectiviteRequestClass extends createZodDto(
  collectiviteIdInputSchemaCoerce
) {}

@ApiTags('Trajectoires')
@ApiBearerAuth()
@Controller('trajectoires/snbc')
export class TrajectoiresController {
  private readonly logger = new Logger(TrajectoiresController.name);

  constructor(
    private readonly trajectoiresXlsxService: TrajectoiresXlsxService,
    private readonly trajectoiresSpreadsheetService: TrajectoiresSpreadsheetService
  ) {}

  @Get('')
  @ApiUsage([ApiUsageEnum.EXTERNAL_API])
  @ApiOperation({
    summary: 'Récupération de la trajectoire SNBC pour la collectivité.',
  })
  @ApiUnprocessableEntityResponse({
    description: `La collectivité est une commune (trajectoire seulement supportée pour les EPCI) ou il manque des données pour la calculer`,
  })
  @ApiOkResponse({
    type: CalculTrajectoireResponseClass,
    description: 'Récupération de la trajectoire SNBC pour la collectivité',
  })
  async calculeTrajectoireSnbc(
    @Query() request: CalculTrajectoireRequestClass,
    @TokenInfo() tokenInfo: AuthenticatedUser
  ): Promise<CalculTrajectoireResponseClass> {
    this.logger.log(
      `Calcul de la trajectoire SNBC pour la collectivité ${
        request.collectiviteId || request.siren || request.communeCode
      }`
    );
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { spreadsheetId, ...response } =
      await this.trajectoiresSpreadsheetService.calculeTrajectoireSnbc(
        request,
        tokenInfo
      );
    return response;
  }

  @ApiUsage([ApiUsageEnum.APP, ApiUsageEnum.EXTERNAL_API])
  @AllowPublicAccess()
  @Get('modele')
  @ApiOperation({
    summary:
      'Téléchargement du modèle de fichier excel utilisé pour le calcul de la trajectoire SNBC.',
  })
  @ApiOkResponse({
    description:
      'Téléchargement du modèle de fichier excel utilisé pour le calcul de la trajectoire SNBC',
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

  @ApiUsage([ApiUsageEnum.APP, ApiUsageEnum.EXTERNAL_API])
  @Get('telechargement')
  @ApiOperation({
    summary:
      'Téléchargement du fichier excel utilisé pour le calcul de la trajectoire SNBC prérempli avec les données de la collectivité.',
  })
  @ApiUnprocessableEntityResponse({
    description: `La collectivité est une commune (trajectoire seulement supportée pour les EPCI) ou il manque des données pour la calculer`,
  })
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
}
