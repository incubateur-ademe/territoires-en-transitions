import { createZodDto } from '@anatine/zod-nestjs';
import { Controller, Get, Logger, Param, Query } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AllowAnonymousAccess } from '../../auth/decorators/allow-anonymous-access.decorator';
import { TokenInfo } from '../../auth/decorators/token-info.decorators';
import { SupabaseJwtPayload } from '../../auth/models/auth.models';
import { getActionStatutsRequestSchema } from '../models/get-action-statuts.request';
import { getActionStatutsResponseSchema } from '../models/get-action-statuts.response';
import { GetCheckScoresResponseType } from '../models/get-check-scores.response';
import { getReferentielScoresRequestSchema } from '../models/get-referentiel-scores.request';
import { getReferentielScoresResponseSchema } from '../models/get-referentiel-scores.response';
import { ReferentielType } from '../models/referentiel.enum';
import ReferentielsScoringService from '../services/referentiels-scoring.service';

class GetReferentielScoresRequestClass extends createZodDto(
  getReferentielScoresRequestSchema,
) {}
class GetReferentielScoresResponseClass extends createZodDto(
  getReferentielScoresResponseSchema,
) {}

class GetActionStatutsRequestClass extends createZodDto(
  getActionStatutsRequestSchema,
) {}

class GetActionStatutsResponseClass extends createZodDto(
  getActionStatutsResponseSchema,
) {}

@ApiTags('Referentiels')
@Controller('collectivites/:collectivite_id/referentiels/:referentiel_id')
export class ReferentielsScoringController {
  private readonly logger = new Logger(ReferentielsScoringController.name);

  constructor(
    private readonly referentielsScoringService: ReferentielsScoringService,
  ) {}

  @AllowAnonymousAccess()
  @Get('action-statuts')
  @ApiResponse({ type: GetActionStatutsResponseClass })
  async getReferentielStatuts(
    @Param('collectivite_id') collectiviteId: number,
    @Param('referentiel_id') referentielId: ReferentielType,
    @Query() parameters: GetActionStatutsRequestClass,
    @TokenInfo() tokenInfo: SupabaseJwtPayload,
  ): Promise<GetActionStatutsResponseClass> {
    return this.referentielsScoringService.getReferentielActionStatuts(
      referentielId,
      collectiviteId,
      parameters.date,
      tokenInfo
    );
  }

  @AllowAnonymousAccess()
  @Get('scores')
  @ApiResponse({ type: GetReferentielScoresResponseClass })
  async getReferentielScoring(
    @Param('collectivite_id') collectiviteId: number,
    @Param('referentiel_id') referentielId: ReferentielType,
    @Query() parameters: GetReferentielScoresRequestClass,
    @TokenInfo() tokenInfo: SupabaseJwtPayload,
  ): Promise<GetReferentielScoresResponseClass> {
    const scores =
      await this.referentielsScoringService.computeScoreForCollectivite(
        referentielId,
        collectiviteId,
        parameters.date,
        tokenInfo
      );
    return { date: parameters.date || new Date().toISOString(), scores };
  }

  @ApiExcludeEndpoint() // Not in documentation
  @Get('check-scores')
  async checkReferentialScore(
    @Param('collectivite_id') collectiviteId: number,
    @Param('referentiel_id') referentielId: ReferentielType,
  ): Promise<GetCheckScoresResponseType> {
    return await this.referentielsScoringService.checkScoreForCollectivite(
        referentielId,
        collectiviteId,
      );
  }
}
