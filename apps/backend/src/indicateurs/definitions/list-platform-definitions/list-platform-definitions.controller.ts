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
import { createZodDto } from 'nestjs-zod';
import { listPlatformDefinitionsApiRequestSchema } from './list-platform-definitions.api-request';
import { listPlatformDefinitionsApiResponseSchema } from './list-platform-definitions.api-response';
import { ListPlatformDefinitionsRepository } from './list-platform-definitions.repository';

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
  constructor(
    private readonly listPlatformDefinitionsRepository: ListPlatformDefinitionsRepository
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
    @Query() input: ListPlatformDefinitionsApiRequestClass
  ) {
    const result =
      await this.listPlatformDefinitionsRepository.listPlatformDefinitionAggregates(
        input
      );

    // Parsing will strip keys that are not in the schema
    // ensuring consistent API response format
    const parsedResult = listPlatformDefinitionsApiResponseSchema.parse(result);

    // const mapToNonBreakingPublicApiOutput = (
    //   definition: ListPlatformDefinitionsApiResponse[number]
    // ) => ({
    //   ...omit(definition, ['estFavori', 'estConfidentiel', 'fiches', 'parent']),

    //   favoris: definition.estFavori,
    //   confidentiel: definition.estConfidentiel,
    //   ficheActions: definition.fiches,
    //   parents: definition.parent ? [definition.parent] : [],
    // });

    return {
      count: parsedResult.length,
      data: parsedResult,
    };
  }
}
