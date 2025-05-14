import { AllowAnonymousAccess } from '@/backend/auth/decorators/allow-anonymous-access.decorator';
import { indicateurDefinitionDetailleeSchema } from '@/backend/indicateurs/index-domain';
import { listDefinitionsApiRequestSchema } from '@/backend/indicateurs/list-definitions/list-definitions.api-request';
import { ListDefinitionsService } from '@/backend/indicateurs/list-definitions/list-definitions.service';
import { ApiUsageEnum } from '@/backend/utils/api/api-usage-type.enum';
import { ApiUsage } from '@/backend/utils/api/api-usage.decorator';
import { createZodDto } from '@anatine/zod-nestjs';
import { Controller, Get, Logger, Query } from '@nestjs/common';
import { ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { TokenInfo } from '../../auth/decorators/token-info.decorators';
import type { AuthenticatedUser } from '../../auth/models/auth.models';

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
@Controller()
export class IndicateursListDefinitionsController {
  private readonly logger = new Logger(
    IndicateursListDefinitionsController.name
  );

  constructor(private readonly service: ListDefinitionsService) {}

  @AllowAnonymousAccess()
  @ApiUsage([ApiUsageEnum.EXTERNAL_API])
  @Get('indicateur-definitions')
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
