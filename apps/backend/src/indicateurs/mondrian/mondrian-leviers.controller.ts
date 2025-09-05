import { getMondrianLeviersDataRequestSchema } from '@/backend/indicateurs/mondrian/get-mondrian-leviers-data.request';
import { getMondrianLeviersDataResponseSchema } from '@/backend/indicateurs/mondrian/get-mondrian-leviers-data.response';
import { MondrianLeviersService } from '@/backend/indicateurs/mondrian/mondrian-leviers.service';
import { ApiUsageEnum } from '@/backend/utils/api/api-usage-type.enum';
import { ApiUsage } from '@/backend/utils/api/api-usage.decorator';
import { createZodDto } from '@anatine/zod-nestjs';
import { Controller, Get, Logger, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { TokenInfo } from '../../users/decorators/token-info.decorators';
import type { AuthenticatedUser } from '../../users/models/auth.models';

/**
 * Création des classes de requête/réponse à partir du schema pour générer automatiquement la documentation OpenAPI et la validation des entrées
 */
export class GetMondrianLeviersDataRequestClass extends createZodDto(
  getMondrianLeviersDataRequestSchema
) {}

export class GetMondrianLeviersDataResponseClass extends createZodDto(
  getMondrianLeviersDataResponseSchema
) {}

@ApiTags('Trajectoires')
@ApiBearerAuth()
@Controller('trajectoires/snbc/leviers')
export class MondrianLeviersController {
  private readonly logger = new Logger(MondrianLeviersController.name);

  constructor(
    private readonly mondrianLeviersService: MondrianLeviersService
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
    type: GetMondrianLeviersDataResponseClass,
    description:
      'Récupération des leviers SGPE et des objectifs de réduction associés pour la collectivité',
  })
  async calculeTrajectoireSnbc(
    @Query() request: GetMondrianLeviersDataRequestClass,
    @TokenInfo() tokenInfo: AuthenticatedUser
  ): Promise<GetMondrianLeviersDataResponseClass> {
    return this.mondrianLeviersService.getData(request, tokenInfo);
  }
}
