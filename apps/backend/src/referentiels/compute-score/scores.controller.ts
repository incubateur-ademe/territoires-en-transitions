import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import { AllowAnonymousAccess } from '@tet/backend/users/decorators/allow-anonymous-access.decorator';
import { TokenInfo } from '@tet/backend/users/decorators/token-info.decorators';
import type { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { ApiUsageEnum } from '@tet/backend/utils/api/api-usage-type.enum';
import { ApiUsage } from '@tet/backend/utils/api/api-usage.decorator';
import type { ReferentielId } from '@tet/domain/referentiels';
import { createZodDto } from 'nestjs-zod';
import { getReferentielMultipleScoresRequestSchema } from '../models/get-referentiel-multiple-scores.request';
import ScoresService from './scores.service';

class GetReferentielMultipleScoresRequestClass extends createZodDto(
  getReferentielMultipleScoresRequestSchema
) {}

@ApiTags('Referentiels')
@Controller('')
export class ReferentielsScoringController {
  constructor(private readonly scoresService: ScoresService) {}

  // utilisé par le bac à sable du référentiel TE
  @ApiUsage([ApiUsageEnum.DATA_PIPELINE_ANALYSIS])
  @AllowAnonymousAccess()
  @ApiExcludeEndpoint() // Not in documentation
  @Get('referentiels/:referentiel_id/scores')
  async getReferentielMultipleScorings(
    @Param('referentiel_id') referentielId: ReferentielId,
    @Query() parameters: GetReferentielMultipleScoresRequestClass,
    @TokenInfo() tokenInfo: AuthenticatedUser
  ) {
    return await this.scoresService.computeScoreForMultipleCollectivite(
      referentielId,
      parameters,
      tokenInfo
    );
  }
}
