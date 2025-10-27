import { getTrajectoireLeviersDataRequestSchema } from '@/backend/indicateurs/trajectoire-leviers/get-trajectoire-leviers-data.request';
import { getTrajectoireLeviersDataResponseSchema } from '@/backend/indicateurs/trajectoire-leviers/get-trajectoire-leviers-data.response';
import { TrajectoireLeviersService } from '@/backend/indicateurs/trajectoire-leviers/trajectoire-leviers.service';
import { ApiUsageEnum } from '@/backend/utils/api/api-usage-type.enum';
import { ApiUsage } from '@/backend/utils/api/api-usage.decorator';
import { Controller, Get, Logger, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { TokenInfo } from '../../users/decorators/token-info.decorators';
import type { AuthenticatedUser } from '../../users/models/auth.models';

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

  constructor(
    private readonly trajectoireLeviersService: TrajectoireLeviersService
  ) {}

  @Get('')
  @ApiUsage([ApiUsageEnum.EXTERNAL_API])
  @ApiOperation({
    summary:
      'Récupération des leviers SGPE et des objectifs de réduction associés pour la collectivité.',
  })
  @ApiUnprocessableEntityResponse({
    description: `La collectivité est une commune (trajectoire seulement supportée pour les EPCI)`,
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
    return this.trajectoireLeviersService.getData(request, tokenInfo);
  }
}
