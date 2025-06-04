import { ApiUsageEnum } from '@/backend/utils/api/api-usage-type.enum';
import { ApiUsage } from '@/backend/utils/api/api-usage.decorator';
import { createZodDto } from '@anatine/zod-nestjs';
import { extendApi } from '@anatine/zod-openapi';
import { Controller, Get, Logger, Next, Query, Res } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExcludeController,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { NextFunction, Response } from 'express';
import { collectiviteRequestSchema } from '../../collectivites/collectivite.request';
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

export class CollectiviteRequestClass extends createZodDto(
  collectiviteRequestSchema
) {}

@ApiTags('Trajectoires')
@ApiExcludeController()
@ApiBearerAuth()
@Controller('trajectoires/snbc')
export class TrajectoiresController {
  private readonly logger = new Logger(TrajectoiresController.name);

  constructor(
    private readonly trajectoiresXlsxService: TrajectoiresXlsxService
  ) {}

  @ApiUsage([ApiUsageEnum.APP])
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

  @ApiUsage([ApiUsageEnum.APP])
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
}
