import type { z } from 'zod';
import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  UpsertIndicateursValeursResponse,
  upsertIndicateursValeursResponseSchema,
} from '@tet/backend/indicateurs/valeurs/write-indicateur-valeurs/upsert-indicateurs-valeurs.response';
import { ApiUsageEnum } from '@tet/backend/utils/api/api-usage-type.enum';
import { ApiUsage } from '@tet/backend/utils/api/api-usage.decorator';
import { TokenInfo } from '../../users/decorators/token-info.decorators';
import type {
  AuthenticatedOrServiceRoleUser,
  AuthenticatedUser,
} from '../../users/models/auth.models';
import ManageIndicateurValeursService from './manage-indicateur-valeurs/manage-indicateur-valeurs.service';
import { getIndicateursValeursApiRequestSchema } from './list-indicateur-valeurs/get-indicateur-valeurs.api-request';
import { getIndicateursValeursResponseSchema } from './list-indicateur-valeurs/get-indicateur-valeurs.response';
import {
  upsertIndicateursValeursRequestSchema,
  type UpsertIndicateursValeursRequest,
} from './write-indicateur-valeurs/upsert-indicateurs-valeurs.request';

type GetIndicateursValeursApiRequest = z.infer<
  typeof getIndicateursValeursApiRequestSchema
>;

type GetIndicateursValeursResponse = z.infer<
  typeof getIndicateursValeursResponseSchema
>;

@ApiTags('Indicateurs')
@ApiBearerAuth()
@Controller()
export class IndicateursValeursController {
  constructor(private readonly service: ManageIndicateurValeursService) {}

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
    standardSchema: getIndicateursValeursResponseSchema.meta({
      id: 'GetIndicateursValeursResponseClass',
    }),
  })
  async getIndicateurValeurs(
    @Query({ schema: getIndicateursValeursApiRequestSchema })
    request: GetIndicateursValeursApiRequest,
    @TokenInfo() tokenInfo: AuthenticatedUser
  ): Promise<GetIndicateursValeursResponse> {
    return this.service.listIndicateurValeurs(request, { user: tokenInfo });
  }

  @ApiUsage([ApiUsageEnum.EXTERNAL_API])
  @Post('indicateurs/valeurs')
  @ApiOperation({
    summary: "Création ou mise à jour des valeurs d'indicateur(s).",
    description:
      "Les valeurs peuvent concerner une ou plusieurs collectivités. A noter également que des valeurs dérivées (ex: indicateur aggrégé) peuvent être calculées lors de l'opération et seront donc également retournées.\n\nCette opération nécessite un **droit d'écriture sur toutes les collectivités affectées**.",
  })
  @ApiCreatedResponse({
    standardSchema: upsertIndicateursValeursResponseSchema.meta({
      id: 'UpsertIndicateursValeursResponseClass',
    }),
    description: 'Les valeurs insérées ou mises à jour.',
  })
  async upsertIndicateurValeurs(
    @Body({
      schema: upsertIndicateursValeursRequestSchema.meta({
        id: 'UpsertIndicateursValeursRequest',
      }),
    })
    request: UpsertIndicateursValeursRequest,
    @TokenInfo() tokenInfo: AuthenticatedOrServiceRoleUser
  ): Promise<UpsertIndicateursValeursResponse> {
    const upsertedValeurs = await this.service.upsertIndicateurValeurs(
      request.valeurs,
      { user: tokenInfo }
    );
    return { valeurs: upsertedValeurs };
  }
}
