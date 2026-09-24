import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AllowAnonymousAccess } from '@tet/backend/users/decorators/allow-anonymous-access.decorator';
import { ApiUsageEnum } from '@tet/backend/utils/api/api-usage-type.enum';
import { ApiUsage } from '@tet/backend/utils/api/api-usage.decorator';
import { TokenInfo } from '@tet/backend/users/decorators/token-info.decorators';
import type { AuthUser } from '@tet/backend/users/models/auth.models';
import { createControllerErrorHandler } from '@tet/backend/utils/nest/controller-error-handler';
import { createZodDto } from 'nestjs-zod';
import { listPlatformDefinitionsApiRequestSchema } from './list-platform-definitions.api-request';
import { listPlatformDefinitionsApiResponseSchema } from './list-platform-definitions.api-response';
import { ListPlatformDefinitionsService } from './list-platform-definitions.service';

class ListPlatformDefinitionsApiRequestClass extends createZodDto(
  listPlatformDefinitionsApiRequestSchema
) {}

class ListPlatformDefinitionsApiResponseClass extends createZodDto(
  listPlatformDefinitionsApiResponseSchema
) {}

@ApiTags('Indicateurs')
@ApiBearerAuth()
@Controller()
export class ListPlatformDefinitionsController {
  private readonly getResultDataOrThrowError = createControllerErrorHandler();
  constructor(
    private readonly listPlatformDefinitionsService: ListPlatformDefinitionsService
  ) {}

  @AllowAnonymousAccess()
  @ApiUsage([ApiUsageEnum.EXTERNAL_API])
  @Get('indicateurs/definitions')
  @ApiOperation({
    summary:
      'Récupération des définitions des indicateurs prédéfinis de la plateforme.',
    description:
      "Les indicateurs prédéfinis sont disponibles à l'ensemble des collectivités.",
  })
  @ApiCreatedResponse({
    type: ListPlatformDefinitionsApiResponseClass,
  })
  async listDefinitions(
    @Query() input: ListPlatformDefinitionsApiRequestClass,
    @TokenInfo() user: AuthUser | null
  ) {
    const result =
      await this.listPlatformDefinitionsService.listPlatformDefinitionAggregates(
        input,
        { user }
      );

    // Parsing will strip keys that are not in the schema
    // ensuring consistent API response format
    const parsedResult = listPlatformDefinitionsApiResponseSchema.parse(
      this.getResultDataOrThrowError(result)
    );

    return {
      count: parsedResult.length,
      data: parsedResult,
    };
  }
}
