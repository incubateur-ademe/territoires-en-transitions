import { UpsertIndicateursValeursResponse } from '@/backend/indicateurs/shared/models/upsert-indicateurs-valeurs.response';
import { ApiUsageEnum } from '@/backend/utils/api/api-usage-type.enum';
import { ApiUsage } from '@/backend/utils/api/api-usage.decorator';
import { createZodDto } from '@anatine/zod-nestjs';
import { Body, Controller, Get, Logger, Post, Query } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiExcludeEndpoint,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TokenInfo } from '../../auth/decorators/token-info.decorators';
import type { AuthenticatedUser } from '../../auth/models/auth.models';
import { getIndicateursValeursApiRequestSchema } from '../shared/models/get-indicateurs.api-request';
import { getIndicateursValeursResponseSchema } from '../shared/models/get-indicateurs.response';
import { UpsertIndicateursValeursRequest } from '../shared/models/upsert-indicateurs-valeurs.request';
import CrudValeursService from './crud-valeurs.service';

/**
 * Création des classes de requête/réponse à partir du schema pour générer automatiquement la documentation OpenAPI et la validation des entrées
 */
class GetIndicateursValeursApiRequestClass extends createZodDto(
  getIndicateursValeursApiRequestSchema
) {}

class GetIndicateursValeursResponseClass extends createZodDto(
  getIndicateursValeursResponseSchema
) {}

@ApiTags('Indicateurs')
@Controller()
export class IndicateursValeursController {
  private readonly logger = new Logger(IndicateursValeursController.name);

  constructor(private readonly service: CrudValeursService) {}

  /**
   * @deprecated Not removed because used by the application & datascientists for now
   * @param request
   * @param tokenInfo
   * @returns
   */
  @ApiUsage([ApiUsageEnum.APP, ApiUsageEnum.DATA_PIPELINE_ANALYSIS])
  @ApiExcludeEndpoint()
  @Get('indicateurs')
  @ApiResponse({ type: GetIndicateursValeursResponseClass })
  async deprecatedGetIndicateurValeurs(
    @Query() request: GetIndicateursValeursApiRequestClass,
    @TokenInfo() tokenInfo: AuthenticatedUser
  ): Promise<GetIndicateursValeursResponseClass> {
    return this.service.getIndicateurValeursGroupees(request, tokenInfo);
  }

  /**
   * @deprecated Not removed because used by the application & datascientists for now
   * @param request
   * @param tokenInfo
   * @returns
   */
  @ApiUsage([ApiUsageEnum.APP, ApiUsageEnum.DATA_PIPELINE_ANALYSIS])
  @ApiExcludeEndpoint()
  @Post('indicateurs')
  @ApiCreatedResponse({
    type: UpsertIndicateursValeursRequest,
  })
  async deprecatedUpsertIndicateurValeurs(
    @Body() request: UpsertIndicateursValeursRequest,
    @TokenInfo() tokenInfo: AuthenticatedUser
  ): Promise<UpsertIndicateursValeursResponse> {
    const upsertedValeurs = await this.service.upsertIndicateurValeurs(
      request.valeurs,
      tokenInfo
    );
    return { valeurs: upsertedValeurs };
  }

  @ApiUsage([ApiUsageEnum.EXTERNAL_API])
  @Get('indicateur-valeurs')
  @ApiResponse({ type: GetIndicateursValeursResponseClass })
  async getIndicateurValeurs(
    @Query() request: GetIndicateursValeursApiRequestClass,
    @TokenInfo() tokenInfo: AuthenticatedUser
  ): Promise<GetIndicateursValeursResponseClass> {
    return this.service.getIndicateurValeursGroupees(request, tokenInfo);
  }

  @ApiUsage([ApiUsageEnum.EXTERNAL_API])
  @Post('indicateur-valeurs')
  @ApiCreatedResponse({
    type: UpsertIndicateursValeursRequest,
  })
  async upsertIndicateurValeurs(
    @Body() request: UpsertIndicateursValeursRequest,
    @TokenInfo() tokenInfo: AuthenticatedUser
  ): Promise<UpsertIndicateursValeursResponse> {
    const upsertedValeurs = await this.service.upsertIndicateurValeurs(
      request.valeurs,
      tokenInfo
    );
    return { valeurs: upsertedValeurs };
  }
}
