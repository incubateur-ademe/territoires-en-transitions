import { AllowAnonymousAccess } from '@/backend/users/decorators/allow-anonymous-access.decorator';
import { TokenInfo } from '@/backend/users/decorators/token-info.decorators';
import { AuthenticatedUser } from '@/backend/users/models/auth.models';
import { ApiUsageEnum } from '@/backend/utils/api/api-usage-type.enum';
import { ApiUsage } from '@/backend/utils/api/api-usage.decorator';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { getReferentielMultipleScoresRequestSchema } from '../models/get-referentiel-multiple-scores.request';
import { ReferentielId } from '../models/referentiel-id.enum';
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
