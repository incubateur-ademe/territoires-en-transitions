import { Controller, Get, Logger, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { getTrajectoireLeviersDataRequestSchema } from '@tet/backend/indicateurs/trajectoire-leviers/get-trajectoire-leviers-data.request';
import { getTrajectoireLeviersDataResponseSchema } from '@tet/backend/indicateurs/trajectoire-leviers/get-trajectoire-leviers-data.response';
import { TrajectoireLeviersService } from '@tet/backend/indicateurs/trajectoire-leviers/trajectoire-leviers.service';
import { ApiUsageEnum } from '@tet/backend/utils/api/api-usage-type.enum';
import { ApiUsage } from '@tet/backend/utils/api/api-usage.decorator';
import { createControllerErrorHandler } from '@tet/backend/utils/nest/controller-error-handler';
import { createZodDto } from 'nestjs-zod';
import { TokenInfo } from '../../users/decorators/token-info.decorators';
import type { AuthenticatedUser } from '../../users/models/auth.models';
import { trajectoireLeviersErrorConfig } from './trajectoire-leviers.errors';

/**
 * Création des classes de requête/réponse à partir du schema pour générer automatiquement la documentation OpenAPI et la validation des entrées
 */
export class GetTrajectoireLeviersDataRequestClass extends createZodDto(
  getTrajectoireLeviersDataRequestSchema
) {}

export class GetTrajectoireLeviersDataResponseClass extends createZodDto(
  getTrajectoireLeviersDataResponseSchema
) {}

@ApiTags('Trajectoires')
@ApiBearerAuth()
@Controller('trajectoires/snbc/leviers')
export class TrajectoireLeviersController {
  private readonly logger = new Logger(TrajectoireLeviersController.name);
  private readonly getResultDataOrThrowError = createControllerErrorHandler(
    trajectoireLeviersErrorConfig
  );

  constructor(
    private readonly trajectoireLeviersService: TrajectoireLeviersService
  ) {}

  @Get('')
  @ApiUsage([ApiUsageEnum.EXTERNAL_API])
  @ApiOperation({
    summary:
      'Récupération des leviers SGPE et des objectifs de réduction associés pour la collectivité.',
  })
  @ApiBadRequestResponse({
    description: `La collectivité est une commune (trajectoire seulement supportée pour les EPCI)`,
  })
  @ApiNotFoundResponse({
    description: `La collectivité est introuvable, ou sa trajectoire SNBC n'a pas été calculée`,
  })
  @ApiOkResponse({
    type: GetTrajectoireLeviersDataResponseClass,
    description:
      'Récupération des leviers SGPE et des objectifs de réduction associés pour la collectivité',
  })
  async calculeTrajectoireSnbc(
    @Query() request: GetTrajectoireLeviersDataRequestClass,
    @TokenInfo() tokenInfo: AuthenticatedUser
  ): Promise<GetTrajectoireLeviersDataResponseClass> {
    return this.getResultDataOrThrowError(
      await this.trajectoireLeviersService.getData(request, tokenInfo)
    );
  }
}
