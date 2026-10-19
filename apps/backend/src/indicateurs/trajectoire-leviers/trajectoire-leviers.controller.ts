import type { z } from 'zod';
import { Controller, Get, Logger, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { getTrajectoireLeviersDataRequestSchema } from '@tet/backend/indicateurs/trajectoire-leviers/get-trajectoire-leviers-data.request';
import { getTrajectoireLeviersDataResponseSchema } from '@tet/backend/indicateurs/trajectoire-leviers/get-trajectoire-leviers-data.response';
import { TrajectoireLeviersService } from '@tet/backend/indicateurs/trajectoire-leviers/trajectoire-leviers.service';
import { ApiUsageEnum } from '@tet/backend/utils/api/api-usage-type.enum';
import { ApiUsage } from '@tet/backend/utils/api/api-usage.decorator';
import { TokenInfo } from '../../users/decorators/token-info.decorators';
import type { AuthenticatedUser } from '../../users/models/auth.models';

export type GetTrajectoireLeviersDataRequest = z.infer<
  typeof getTrajectoireLeviersDataRequestSchema
>;

export type GetTrajectoireLeviersDataResponse = z.infer<
  typeof getTrajectoireLeviersDataResponseSchema
>;

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
    standardSchema: getTrajectoireLeviersDataResponseSchema.meta({
      id: 'GetTrajectoireLeviersDataResponseClass',
    }),
    description:
      'Récupération des leviers SGPE et des objectifs de réduction associés pour la collectivité',
  })
  async calculeTrajectoireSnbc(
    @Query({ schema: getTrajectoireLeviersDataRequestSchema })
    request: GetTrajectoireLeviersDataRequest,
    @TokenInfo() tokenInfo: AuthenticatedUser
  ): Promise<GetTrajectoireLeviersDataResponse> {
    return this.trajectoireLeviersService.getData(request, tokenInfo);
  }
}
