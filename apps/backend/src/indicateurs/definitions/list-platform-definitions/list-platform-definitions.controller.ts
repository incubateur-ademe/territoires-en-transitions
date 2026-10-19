import { z } from 'zod';
import {
  Controller,
  Get,
  Query,
  SerializeOptions,
  StandardSchemaSerializerInterceptor,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AllowAnonymousAccess } from '@tet/backend/users/decorators/allow-anonymous-access.decorator';
import { ApiUsageEnum } from '@tet/backend/utils/api/api-usage-type.enum';
import { ApiUsage } from '@tet/backend/utils/api/api-usage.decorator';
import { TokenInfo } from '@tet/backend/users/decorators/token-info.decorators';
import type { AuthUser } from '@tet/backend/users/models/auth.models';
import { createControllerErrorHandler } from '@tet/backend/utils/nest/controller-error-handler';
import { listPlatformDefinitionsApiRequestSchema } from './list-platform-definitions.api-request';
import {
  listPlatformDefinitionsApiResponseSchema,
  type ListPlatformDefinitionsApiResponse,
} from './list-platform-definitions.api-response';
import { ListPlatformDefinitionsService } from './list-platform-definitions.service';

type ListPlatformDefinitionsApiRequest = z.infer<
  typeof listPlatformDefinitionsApiRequestSchema
>;

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
  @UseInterceptors(StandardSchemaSerializerInterceptor)
  @SerializeOptions({ schema: listPlatformDefinitionsApiResponseSchema })
  @ApiOkResponse({
    standardSchema: listPlatformDefinitionsApiResponseSchema,
  })
  async listDefinitions(
    @Query({ schema: listPlatformDefinitionsApiRequestSchema })
    input: ListPlatformDefinitionsApiRequest,
    @TokenInfo() user: AuthUser | null
  ): Promise<ListPlatformDefinitionsApiResponse> {
    const result =
      await this.listPlatformDefinitionsService.listPlatformDefinitionAggregates(
        input,
        { user }
      );

    const definitions = this.getResultDataOrThrowError(result);

    return {
      count: definitions.length,
      data: definitions,
    };
  }
}
