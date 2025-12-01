import { Controller, Get, Logger, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AllowAnonymousAccess } from '@tet/backend/users/decorators/allow-anonymous-access.decorator';
import { ApiUsageEnum } from '@tet/backend/utils/api/api-usage-type.enum';
import { ApiUsage } from '@tet/backend/utils/api/api-usage.decorator';
import { omit } from 'es-toolkit';
import { createZodDto } from 'nestjs-zod';
import { TokenInfo } from '../../../users/decorators/token-info.decorators';
import type { AuthenticatedUser } from '../../../users/models/auth.models';
import { listDefinitionsApiRequestSchema } from './list-definitions.api-request';
import { listDefinitionsInputSchema } from './list-definitions.input';
import {
  ListDefinitionsOutput,
  definitionListItemSchema,
} from './list-definitions.output';
import { ListDefinitionsService } from './list-definitions.service';

/**
 * Création des classes de requête/réponse à partir du schema pour générer automatiquement la documentation OpenAPI et la validation des entrées
 */
class ListDefinitionsApiRequestClass extends createZodDto(
  listDefinitionsApiRequestSchema
) {}

class ListDefinitionsApiResponseClass extends createZodDto(
  definitionListItemSchema.array()
) {}

@ApiTags('Indicateurs')
@ApiBearerAuth()
@Controller()
export class IndicateursListDefinitionsController {
  private readonly logger = new Logger(
    IndicateursListDefinitionsController.name
  );

  constructor(private readonly service: ListDefinitionsService) {}

  @AllowAnonymousAccess()
  @ApiUsage([ApiUsageEnum.EXTERNAL_API])
  @Get('indicateur-definitions')
  @ApiOperation({
    summary: 'Récupération des définitions des indicateurs.',
    description:
      "Récupération des définition d'indicateurs (titre, unité, bornes, etc.). Si un `collectiteId` est spécifié, la réponse inclue les indicateurs personnalisés de la collectivité.\n\nLes données sont publiques et donc accessibles **quelque soit les droits de l'utilisateur**.",
  })
  @ApiCreatedResponse({
    type: ListDefinitionsApiResponseClass,
  })
  async listIndicateurDefinitions(
    @Query() request: ListDefinitionsApiRequestClass,
    @TokenInfo() user: AuthenticatedUser
  ) {
    const input = listDefinitionsInputSchema.parse({
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

    const result = await this.service.listDefinitions(input, user);

    const mapToNonBreakingPublicApiOutput = (
      definition: ListDefinitionsOutput['data'][number]
    ) => ({
      ...omit(definition, ['estFavori', 'estConfidentiel', 'fiches', 'parent']),

      favoris: definition.estFavori,
      confidentiel: definition.estConfidentiel,
      ficheActions: definition.fiches,
      parents: definition.parent ? [definition.parent] : [],
    });

    return {
      ...result,
      data: result.data.map(mapToNonBreakingPublicApiOutput),
    };
  }
}
