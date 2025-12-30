import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UpsertIndicateursValeursResponse } from '@tet/backend/indicateurs/valeurs/upsert-indicateurs-valeurs.response';
import { ApiUsageEnum } from '@tet/backend/utils/api/api-usage-type.enum';
import { ApiUsage } from '@tet/backend/utils/api/api-usage.decorator';
import { createZodDto } from 'nestjs-zod';
import { TokenInfo } from '../../users/decorators/token-info.decorators';
import type { AuthenticatedUser } from '../../users/models/auth.models';
import CrudValeursService from './crud-valeurs.service';
import { getIndicateursValeursApiRequestSchema } from './get-indicateur-valeurs.api-request';
import { getIndicateursValeursResponseSchema } from './get-indicateur-valeurs.response';
import { UpsertIndicateursValeursRequest } from './upsert-indicateurs-valeurs.request';

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
  constructor(private readonly service: CrudValeursService) {}

  @ApiUsage([ApiUsageEnum.EXTERNAL_API])
  @Get('indicateurs/valeurs')
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
    return this.service.listIndicateurValeurs(request, tokenInfo);
  }

  @ApiUsage([ApiUsageEnum.EXTERNAL_API])
  @Post('indicateurs/valeurs')
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
