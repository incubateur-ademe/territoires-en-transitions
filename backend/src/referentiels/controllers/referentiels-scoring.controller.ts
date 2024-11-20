import { createZodDto } from '@anatine/zod-nestjs';
import { Controller, Get, Logger, Param, Query } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AllowAnonymousAccess } from '../../auth/decorators/allow-anonymous-access.decorator';
import { User } from '../../auth/decorators/user.decorator';
import { AuthenticatedUser } from '../../auth/models/authenticated-user.models';
import { getActionStatutsRequestSchema } from '../models/get-action-statuts.request';
import { getActionStatutsResponseSchema } from '../models/get-action-statuts.response';
import { GetCheckScoresResponseType } from '../models/get-check-scores.response';
import { getReferentielMultipleScoresRequestSchema } from '../models/get-referentiel-multiple-scores.request';
import { getReferentielMultipleScoresResponseSchema } from '../models/get-referentiel-multiple-scores.response';
import { getReferentielScoresRequestSchema } from '../models/get-referentiel-scores.request';
import { getReferentielScoresResponseSchema } from '../models/get-referentiel-scores.response';
import { ReferentielType } from '../models/referentiel.enum';
import ReferentielsScoringService from '../services/referentiels-scoring.service';

class GetReferentielScoresRequestClass extends createZodDto(
  getReferentielScoresRequestSchema
) {}
class GetReferentielScoresResponseClass extends createZodDto(
  getReferentielScoresResponseSchema
) {}

class GetReferentielMultipleScoresRequestClass extends createZodDto(
  getReferentielMultipleScoresRequestSchema
) {}

class GetReferentielMultipleScoresResponseClass extends createZodDto(
  getReferentielMultipleScoresResponseSchema
) {}

class GetActionStatutsRequestClass extends createZodDto(
  getActionStatutsRequestSchema
) {}

class GetActionStatutsResponseClass extends createZodDto(
  getActionStatutsResponseSchema
) {}

@ApiTags('Referentiels')
@Controller('')
export class ReferentielsScoringController {
  private readonly logger = new Logger(ReferentielsScoringController.name);

  constructor(
    private readonly referentielsScoringService: ReferentielsScoringService
  ) {}

  @AllowAnonymousAccess()
  @Get(
    'collectivites/:collectivite_id/referentiels/:referentiel_id/action-statuts'
  )
  @ApiResponse({ type: GetActionStatutsResponseClass })
  async getReferentielStatuts(
    @Param('collectivite_id') collectiviteId: number,
    @Param('referentiel_id') referentielId: ReferentielType,
    @Query() parameters: GetActionStatutsRequestClass,
    @User() user: AuthenticatedUser
  ): Promise<GetActionStatutsResponseClass> {
    return this.referentielsScoringService.getReferentielActionStatuts(
      referentielId,
      collectiviteId,
      parameters.date,
      user
    );
  }

  @AllowAnonymousAccess()
  @Get('referentiels/:referentiel_id/scores')
  @ApiResponse({ type: GetReferentielMultipleScoresResponseClass })
  async getReferentielMultipleScorings(
    @Param('referentiel_id') referentielId: ReferentielType,
    @Query() parameters: GetReferentielMultipleScoresRequestClass,
    @User() user: AuthenticatedUser
  ): Promise<GetReferentielMultipleScoresResponseClass> {
    return await this.referentielsScoringService.computeScoreForMultipleCollectivite(
      referentielId,
      parameters,
      user
    );
  }

  @AllowAnonymousAccess()
  @Get('collectivites/:collectivite_id/referentiels/:referentiel_id/scores')
  @ApiResponse({ type: GetReferentielScoresResponseClass })
  async getReferentielScoring(
    @Param('collectivite_id') collectiviteId: number,
    @Param('referentiel_id') referentielId: ReferentielType,
    @Query() parameters: GetReferentielScoresRequestClass,
    @User() user: AuthenticatedUser
  ): Promise<GetReferentielScoresResponseClass> {
    return await this.referentielsScoringService.computeScoreForCollectivite(
      referentielId,
      collectiviteId,
      parameters,
      user
    );
  }

  @AllowAnonymousAccess()
  @ApiExcludeEndpoint() // Not in documentation
  @Get(
    'collectivites/:collectivite_id/referentiels/:referentiel_id/check-scores'
  )
  async checkReferentialScore(
    @Param('collectivite_id') collectiviteId: number,
    @Param('referentiel_id') referentielId: ReferentielType
  ): Promise<GetCheckScoresResponseType> {
    return await this.referentielsScoringService.checkScoreForCollectivite(
      referentielId,
      collectiviteId
    );
  }
}
