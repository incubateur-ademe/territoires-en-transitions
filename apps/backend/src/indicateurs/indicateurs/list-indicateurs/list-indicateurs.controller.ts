import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiUsageEnum } from '@tet/backend/utils/api/api-usage-type.enum';
import { ApiUsage } from '@tet/backend/utils/api/api-usage.decorator';
import { omit } from 'es-toolkit';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';
import { TokenInfo } from '../../../users/decorators/token-info.decorators';
import type { AuthenticatedUser } from '../../../users/models/auth.models';
import { listIndicateursApiRequestSchema } from './list-indicateurs.api-request';
import {
  indicateurListItemSchema,
  ListIndicateursOutput,
} from './list-indicateurs.output';
import { ListIndicateursService } from './list-indicateurs.service';
import { listIndicateursInputSchema } from './list-indicateurs.input';

class ListIndicateursApiRequestClass extends createZodDto(
  listIndicateursApiRequestSchema
) {}

class ListIndicateursApiResponseClass extends createZodDto(
  z.array(indicateurListItemSchema)
) {}

@ApiTags('Indicateurs')
@ApiBearerAuth()
@Controller()
export class ListIndicateursController {
  constructor(
    private readonly listIndicateursService: ListIndicateursService
  ) {}

  @ApiUsage([ApiUsageEnum.EXTERNAL_API])
  @Get('indicateurs')
  @ApiOperation({
    summary: "Récupération des indicateurs d'une collectivité",
    description:
      'Les indicateurs comprennent les indicateurs prédéfinis dans la plateforme avec leurs propriétés spécifiques à la collectivité (pilotes, services, etc.), plus les indicateurs personnalisés créés par la collectivité.',
  })
  @ApiCreatedResponse({
    type: ListIndicateursApiResponseClass,
  })
  async listIndicateurs(
    @Query() request: ListIndicateursApiRequestClass,
    @TokenInfo() user: AuthenticatedUser
  ) {
    const input = listIndicateursInputSchema.parse({
      collectiviteId: request.collectiviteId,
      filters: {
        indicateurIds: request.indicateurIds,
        identifiantsReferentiel: request.identifiantsReferentiel,
      },
      queryOptions: {
        page: request.page,
        limit: request.limit,
      },
    });

    const result = await this.listIndicateursService.listIndicateurs(
      input,
      user
    );

    const mapToNonBreakingPublicApiOutput = (
      indicateur: ListIndicateursOutput['data'][number]
    ) => ({
      ...omit(indicateur, ['estFavori', 'estConfidentiel', 'fiches', 'parent']),

      favoris: indicateur.estFavori,
      confidentiel: indicateur.estConfidentiel,
      ficheActions: indicateur.fiches,
      parents: indicateur.parent ? [indicateur.parent] : [],
    });

    return {
      ...result,
      data: result.data.map(mapToNonBreakingPublicApiOutput),
    };
  }
}
