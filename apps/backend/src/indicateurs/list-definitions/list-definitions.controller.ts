import { listDefinitionsApiRequestSchema } from '@/backend/indicateurs/list-definitions/list-definitions.api-request';
import { indicateurDefinitionDetailleeSchema } from '@/backend/indicateurs/list-definitions/list-definitions.response';
import { ListDefinitionsService } from '@/backend/indicateurs/list-definitions/list-definitions.service';
import { AllowAnonymousAccess } from '@/backend/users/decorators/allow-anonymous-access.decorator';
import { ApiUsageEnum } from '@/backend/utils/api/api-usage-type.enum';
import { ApiUsage } from '@/backend/utils/api/api-usage.decorator';
import { createZodDto } from '@anatine/zod-nestjs';
import { Controller, Get, Logger, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { TokenInfo } from '../../users/decorators/token-info.decorators';
import type { AuthenticatedUser } from '../../users/models/auth.models';

/**
 * Création des classes de requête/réponse à partir du schema pour générer automatiquement la documentation OpenAPI et la validation des entrées
 */
class ListDefinitionsApiRequestClass extends createZodDto(
  listDefinitionsApiRequestSchema
) {}

class ListDefinitionsApiResponseClass extends createZodDto(
  indicateurDefinitionDetailleeSchema.array()
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
    @TokenInfo() tokenInfo: AuthenticatedUser
  ) {
    const definitionsDetaillees = await this.service.getDefinitionsDetaillees(
      request,
      tokenInfo
    );
    return definitionsDetaillees;
  }
}
