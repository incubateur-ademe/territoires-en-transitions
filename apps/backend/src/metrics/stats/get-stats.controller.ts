import {
  All,
  Controller,
  Get,
  MethodNotAllowedException,
  Query,
  Res,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiExcludeEndpoint,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AllowPublicAccess } from '@tet/backend/users/decorators/allow-public-access.decorator';
import { ApiUsageEnum } from '@tet/backend/utils/api/api-usage-type.enum';
import { ApiUsage } from '@tet/backend/utils/api/api-usage.decorator';
import { createControllerErrorHandler } from '@tet/backend/utils/nest/controller-error-handler';
import type { Response } from 'express';
import { createZodDto } from 'nestjs-zod';
import { getStatsInputSchema } from './get-stats.input';
import { getStatsOutputSchema } from './get-stats.output';
import { getCacheMaxAgeSeconds } from './get-stats.rules';
import { GetStatsService } from './get-stats.service';

/** Chemin imposé par la spec commune aux startups : servi hors du préfixe
 * `api/v1` (cf. `GLOBAL_PREFIX_EXCLUDED_PATHS`). */
export const STATS_ROUTE_PATH = 'api/stats';

class GetStatsInputClass extends createZodDto(getStatsInputSchema) {}

class GetStatsOutputClass extends createZodDto(getStatsOutputSchema) {}

@ApiTags('Statistiques')
@Controller(STATS_ROUTE_PATH)
export class GetStatsController {
  private readonly getResultDataOrThrowError = createControllerErrorHandler();

  constructor(private readonly getStatsService: GetStatsService) {}

  @AllowPublicAccess()
  @ApiUsage([ApiUsageEnum.EXTERNAL_API])
  @Get()
  @ApiOperation({
    summary: 'Nombre de fiches action créées par période.',
    description:
      'KPI publique de la startup, au format commun de l’Accélérateur de la transition écologique. Valeurs non cumulées, une par période jusqu’à la période en cours incluse, 0 quand rien n’a été créé.',
  })
  @ApiOkResponse({ type: GetStatsOutputClass })
  @ApiBadRequestResponse({
    description: '`since` ou `periodicity` invalide.',
  })
  async getStats(
    @Query() input: GetStatsInputClass,
    @Res({ passthrough: true }) res: Response
  ) {
    const now = new Date();
    const result = await this.getStatsService.getStatsCreationFiches(
      input,
      now
    );
    const data = this.getResultDataOrThrowError(result);

    res.setHeader(
      'Cache-Control',
      `public, max-age=${getCacheMaxAgeSeconds({
        now,
        periodicity: input.periodicity,
      })}`
    );
    return data;
  }

  /** La spec n'autorise que GET (et OPTIONS, géré par le middleware CORS). */
  @AllowPublicAccess()
  @ApiExcludeEndpoint()
  @All()
  rejectOtherMethods(@Res({ passthrough: true }) res: Response): never {
    res.setHeader('Allow', 'GET, OPTIONS');
    throw new MethodNotAllowedException();
  }
}
