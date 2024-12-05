import { createZodDto } from '@anatine/zod-nestjs';
import {
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { ApiExcludeEndpoint, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AllowAnonymousAccess } from '../../auth/decorators/allow-anonymous-access.decorator';
import { TokenInfo } from '../../auth/decorators/token-info.decorators';
import { AuthenticatedUser, AuthUser } from '../../auth/models/auth.models';
import { checkMultipleReferentielScoresRequestSchema } from '../models/check-multiple-referentiel-scores.request';
import { CheckReferentielScoresRequestType } from '../models/check-referentiel-scores.request';
import { getActionStatutsRequestSchema } from '../models/get-action-statuts.request';
import { getActionStatutsResponseSchema } from '../models/get-action-statuts.response';
import { GetCheckScoresResponseType } from '../models/get-check-scores.response';
import { GetMultipleCheckScoresResponseType } from '../models/get-multiple-check-scores.response';
import { getReferentielMultipleScoresRequestSchema } from '../models/get-referentiel-multiple-scores.request';
import { getReferentielMultipleScoresResponseSchema } from '../models/get-referentiel-multiple-scores.response';
import { getReferentielScoresRequestSchema } from '../models/get-referentiel-scores.request';
import { getReferentielScoresResponseSchema } from '../models/get-referentiel-scores.response';
import { getScoreSnapshotsRequestSchema } from '../models/get-score-snapshots.request';
import { getScoreSnapshotsResponseSchema } from '../models/get-score-snapshots.response';
import { ReferentielType } from '../models/referentiel.enum';
import ReferentielsScoringSnapshotsService from '../services/referentiels-scoring-snapshots.service';
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

class CheckMultipleReferentielScoresRequestClass extends createZodDto(
  checkMultipleReferentielScoresRequestSchema
) {}

class GetScoreSnapshotsRequestClass extends createZodDto(
  getScoreSnapshotsRequestSchema
) {}

class GetScoreSnapshotsResponseClass extends createZodDto(
  getScoreSnapshotsResponseSchema
) {}

@ApiTags('Referentiels')
@Controller('')
export class ReferentielsScoringController {
  private readonly logger = new Logger(ReferentielsScoringController.name);

  constructor(
    private readonly referentielsScoringService: ReferentielsScoringService,
    private readonly referentielsScoringSnapshotsService: ReferentielsScoringSnapshotsService
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
    @TokenInfo() tokenInfo: AuthenticatedUser
  ): Promise<GetActionStatutsResponseClass> {
    return this.referentielsScoringService.getReferentielActionStatuts(
      referentielId,
      collectiviteId,
      parameters.date,
      tokenInfo
    );
  }

  @AllowAnonymousAccess()
  @Get('referentiels/:referentiel_id/scores')
  @ApiResponse({ type: GetReferentielMultipleScoresResponseClass })
  async getReferentielMultipleScorings(
    @Param('referentiel_id') referentielId: ReferentielType,
    @Query() parameters: GetReferentielMultipleScoresRequestClass,
    @TokenInfo() tokenInfo: AuthenticatedUser
  ): Promise<GetReferentielMultipleScoresResponseClass> {
    return await this.referentielsScoringService.computeScoreForMultipleCollectivite(
      referentielId,
      parameters,
      tokenInfo
    );
  }

  @AllowAnonymousAccess()
  @Get('collectivites/:collectivite_id/referentiels/:referentiel_id/scores')
  @ApiResponse({ type: GetReferentielScoresResponseClass })
  async getReferentielScoring(
    @Param('collectivite_id') collectiviteId: number,
    @Param('referentiel_id') referentielId: ReferentielType,
    @Query() parameters: GetReferentielScoresRequestClass,
    @TokenInfo() tokenInfo: AuthenticatedUser
  ): Promise<GetReferentielScoresResponseClass> {
    return await this.referentielsScoringService.computeScoreForCollectivite(
      referentielId,
      collectiviteId,
      parameters,
      tokenInfo
    );
  }

  @AllowAnonymousAccess()
  @ApiExcludeEndpoint() // Not in documentation
  @Get(
    'collectivites/:collectivite_id/referentiels/:referentiel_id/check-scores'
  )
  async checkReferentielScore(
    @Param('collectivite_id') collectiviteId: number,
    @Param('referentiel_id') referentielId: ReferentielType,
    @Query() parameters: CheckReferentielScoresRequestType,
    @Req() req: Request
  ): Promise<GetCheckScoresResponseType> {
    const checkReferentielHostUrl = `${req.protocol}://${req.get('Host')}`;
    return await this.referentielsScoringService.checkScoreForCollectivite(
      referentielId,
      collectiviteId,
      parameters,
      checkReferentielHostUrl
    );
  }

  @AllowAnonymousAccess()
  @Get(
    'collectivites/:collectivite_id/referentiels/:referentiel_id/score-snapshots'
  )
  async listSummary(
    @Param('collectivite_id') collectiviteId: number,
    @Param('referentiel_id') referentielId: ReferentielType,
    @Query() parameters: GetScoreSnapshotsRequestClass,
    @TokenInfo() tokenInfo: AuthUser
  ): Promise<GetScoreSnapshotsResponseClass> {
    return this.referentielsScoringSnapshotsService.listSummary(
      collectiviteId,
      referentielId,
      parameters
    );
  }

  @AllowAnonymousAccess()
  @Get(
    'collectivites/:collectivite_id/referentiels/:referentiel_id/score-snapshots/:snapshot_ref'
  )
  async getReferentielScoreSnapshot(
    @Param('collectivite_id') collectiviteId: number,
    @Param('referentiel_id') referentielId: ReferentielType,
    @Param('snapshot_ref') snapshotRef: string,
    @TokenInfo() tokenInfo: AuthenticatedUser
  ) {
    if (
      snapshotRef ===
      ReferentielsScoringSnapshotsService.SCORE_COURANT_SNAPSHOT_REF
    ) {
      return this.referentielsScoringService.getOrCreateCurrentScore(
        collectiviteId,
        referentielId
      );
    } else {
      return this.referentielsScoringSnapshotsService.get(
        collectiviteId,
        referentielId,
        snapshotRef
      );
    }
  }

  @Delete(
    'collectivites/:collectivite_id/referentiels/:referentiel_id/score-snapshots/:snapshot_ref'
  )
  async deleteReferentielScoreSnapshot(
    @Param('collectivite_id') collectiviteId: number,
    @Param('referentiel_id') referentielId: ReferentielType,
    @Param('snapshot_ref') snapshotRef: string,
    @TokenInfo() tokenInfo: AuthUser
  ): Promise<void> {
    return this.referentielsScoringSnapshotsService.delete(
      collectiviteId,
      referentielId,
      snapshotRef,
      tokenInfo
    );
  }

  @AllowAnonymousAccess()
  @ApiExcludeEndpoint() // Not in documentation
  @Get('referentiels/all/check-last-scores')
  async checkLastReferentielsScore(
    @Query() parameters: CheckMultipleReferentielScoresRequestClass,
    @Req() req: Request
  ): Promise<GetMultipleCheckScoresResponseType> {
    const checkHostUrl = `${req.protocol}://${req.get('Host')}`;
    return await this.referentielsScoringService.checkScoreForLastModifiedCollectivite(
      parameters,
      checkHostUrl
    );
  }

  @AllowAnonymousAccess()
  @ApiExcludeEndpoint() // Not in documentation
  @Get('referentiels/all/save-last-scores')
  async saveLastReferentielsScoreNewTable() {
    // TODO: endpoint to be removed, only used during migration
    return await this.referentielsScoringService.saveLastReferentielsScoreToNewTable();
  }
}
