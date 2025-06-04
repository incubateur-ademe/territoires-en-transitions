import { UpsertIndicateursValeursResponse } from '@/backend/indicateurs/shared/models/upsert-indicateurs-valeurs.response';
import { ApiUsageEnum } from '@/backend/utils/api/api-usage-type.enum';
import { ApiUsage } from '@/backend/utils/api/api-usage.decorator';
import { createZodDto } from '@anatine/zod-nestjs';
import { Body, Controller, Get, Logger, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiExcludeEndpoint,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TokenInfo } from '../../users/decorators/token-info.decorators';
import type { AuthenticatedUser } from '../../users/models/auth.models';
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
@ApiBearerAuth()
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
  @ApiOperation({
    summary:
      "Récupération des valeurs d'un ou plusieurs indicateurs d'une collectivité.",
    description:
      "Récupération des valeurs d'un ou plusieurs indicateurs pour une collectivité donnée. Un indicateur peut être identifié par son identifiant numérique ou textuel (ex: cae_1.a).\n\nLes données publiques accessibles **quelque soit les droits de l'utilisateur** n'inclue pas la dernière valeur disponible si l'indicateur est défini comme étant confidentiel pour la collectivité.\n\nToutes les données sont accessibles (y compris la dernière année) si l'utilisateur dispose **d'un droit de lecture** sur la collectivité.",
  })
  @ApiResponse({
    description:
      "Les valeurs d'une collectivité pour un ou plusieurs indicateurs organisées par indicateur et par source.",
    type: GetIndicateursValeursResponseClass,
  })
  async getIndicateurValeurs(
    @Query() request: GetIndicateursValeursApiRequestClass,
    @TokenInfo() tokenInfo: AuthenticatedUser
  ): Promise<GetIndicateursValeursResponseClass> {
    return this.service.getIndicateurValeursGroupees(request, tokenInfo);
  }

  @ApiUsage([ApiUsageEnum.EXTERNAL_API])
  @Post('indicateur-valeurs')
  @ApiOperation({
    summary: "Création ou mise à jour des valeurs d'indicateur(s).",
    description:
      "Les valeurs peuvent concerner une ou plusieurs collectivités. A noter également que des valeurs dérivées (ex: indicateur aggrégé) peuvent être calculées lors de l'opération et seront donc également retournées.\n\nCette opération nécessite un **droit d'écriture sur toutes les collectivités affectées**",
  })
  @ApiCreatedResponse({
    type: UpsertIndicateursValeursRequest,
    description: 'Les valeurs insérées ou mises à jour.',
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
