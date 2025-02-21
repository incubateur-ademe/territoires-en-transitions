import { COLLECTIVITE_ID_PARAM_KEY } from '@/backend/collectivites/shared/models/collectivite-api.constants';
import { createZodDto } from '@anatine/zod-nestjs';
import {
  Controller,
  Delete,
  Get,
  Logger,
  Next,
  Param,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ApiExcludeEndpoint, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NextFunction, Request, Response } from 'express';
import { AllowAnonymousAccess } from '../../auth/decorators/allow-anonymous-access.decorator';
import { TokenInfo } from '../../auth/decorators/token-info.decorators';
import { AuthenticatedUser, AuthUser } from '../../auth/models/auth.models';
import ExportReferentielScoreService from '../export-score/export-referentiel-score.service';
import { checkMultipleReferentielScoresRequestSchema } from '../models/check-multiple-referentiel-scores.request';
import { CheckReferentielScoresRequestType } from '../models/check-referentiel-scores.request';
import { getActionStatutsRequestSchema } from '../models/get-action-statuts.request';
import { GetCheckScoresResponseType } from '../models/get-check-scores.response';
import { GetMultipleCheckScoresResponseType } from '../models/get-multiple-check-scores.response';
import { getReferentielMultipleScoresRequestSchema } from '../models/get-referentiel-multiple-scores.request';
import { getReferentielMultipleScoresResponseSchema } from '../models/get-referentiel-multiple-scores.response';
import { getReferentielScoresRequestSchema } from '../models/get-referentiel-scores.request';
import { getScoreSnapshotRequestSchema } from '../models/get-score-snapshot.request';
import { getScoreSnapshotsRequestSchema } from '../models/get-score-snapshots.request';
import { getScoreSnapshotsResponseSchema } from '../models/get-score-snapshots.response';
import {
  REFERENTIEL_ID_PARAM_KEY,
  SNAPSHOT_REF_PARAM_KEY,
} from '../models/referentiel-api.constants';
import { ReferentielId } from '../models/referentiel-id.enum';
import { ReferentielsScoringSnapshotsService } from '../snapshots/referentiels-scoring-snapshots.service';
import { actionStatutsByActionIdSchema } from './action-statuts-by-action-id.dto';
import {
  getReferentielScoresResponseSchema,
  GetReferentielScoresResponseType,
} from './get-referentiel-scores.response';
import ReferentielsScoringService from './referentiels-scoring.service';

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
  actionStatutsByActionIdSchema
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

class GetScoreSnapshotRequestClass extends createZodDto(
  getScoreSnapshotRequestSchema
) {}

@ApiTags('Referentiels')
@Controller('')
export class ReferentielsScoringController {
  private readonly logger = new Logger(ReferentielsScoringController.name);

  constructor(
    private readonly referentielsScoringService: ReferentielsScoringService,
    private readonly referentielsScoringSnapshotsService: ReferentielsScoringSnapshotsService,
    private readonly exportReferentielScoreService: ExportReferentielScoreService
  ) {}

  @AllowAnonymousAccess()
  @Get(
    'collectivites/:collectivite_id/referentiels/:referentiel_id/action-statuts'
  )
  @ApiResponse({ type: GetActionStatutsResponseClass })
  async getReferentielStatuts(
    @Param('collectivite_id') collectiviteId: number,
    @Param('referentiel_id') referentielId: ReferentielId,
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
    @Param('referentiel_id') referentielId: ReferentielId,
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
    @Param('referentiel_id') referentielId: ReferentielId,
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
    @Param('referentiel_id') referentielId: ReferentielId,
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
    `collectivites/:${COLLECTIVITE_ID_PARAM_KEY}/referentiels/:${REFERENTIEL_ID_PARAM_KEY}/score-snapshots`
  )
  @ApiResponse({ type: GetScoreSnapshotsResponseClass })
  async list(
    @Param(COLLECTIVITE_ID_PARAM_KEY) collectiviteId: number,
    @Param(REFERENTIEL_ID_PARAM_KEY) referentielId: ReferentielId,
    @Query() parameters: GetScoreSnapshotsRequestClass,
    @TokenInfo() tokenInfo: AuthUser
  ): Promise<GetScoreSnapshotsResponseClass> {
    return this.referentielsScoringSnapshotsService.list(
      collectiviteId,
      referentielId,
      parameters
    );
  }

  @AllowAnonymousAccess()
  @Get(
    `collectivites/:${COLLECTIVITE_ID_PARAM_KEY}/referentiels/:${REFERENTIEL_ID_PARAM_KEY}/score-snapshots/:${SNAPSHOT_REF_PARAM_KEY}`
  )
  async getReferentielScoreSnapshot(
    @Param(COLLECTIVITE_ID_PARAM_KEY) collectiviteId: number,
    @Param(REFERENTIEL_ID_PARAM_KEY) referentielId: ReferentielId,
    @Param(SNAPSHOT_REF_PARAM_KEY) snapshotRef: string,
    @Query() parameters: GetScoreSnapshotRequestClass,
    @TokenInfo() tokenInfo: AuthenticatedUser
  ) {
    if (
      snapshotRef ===
      ReferentielsScoringSnapshotsService.SCORE_COURANT_SNAPSHOT_REF
    ) {
      return this.referentielsScoringService.getOrCreateCurrentScore(
        collectiviteId,
        referentielId,
        parameters.forceRecalculScoreCourant
      );
    } else {
      return this.referentielsScoringSnapshotsService.get(
        collectiviteId,
        referentielId,
        snapshotRef
      ) as Promise<GetReferentielScoresResponseType>;
    }
  }

  @AllowAnonymousAccess()
  @Get(
    `collectivites/:${COLLECTIVITE_ID_PARAM_KEY}/referentiels/:${REFERENTIEL_ID_PARAM_KEY}/score-snapshots/:${SNAPSHOT_REF_PARAM_KEY}/export`
  )
  async exportReferentielScoreSnapshot(
    @Param(COLLECTIVITE_ID_PARAM_KEY) collectiviteId: number,
    @Param(REFERENTIEL_ID_PARAM_KEY) referentielId: ReferentielId,
    @Param(SNAPSHOT_REF_PARAM_KEY) snapshotRef: string,
    @Query() parameters: GetScoreSnapshotRequestClass,
    @TokenInfo() tokenInfo: AuthenticatedUser,
    @Res() res: Response,
    @Next() next: NextFunction
  ) {
    this.logger.log(
      `Export du score du referentiel ${referentielId} pour la collectivite ${collectiviteId} et le snapshot ${snapshotRef}`
    );
    this.exportReferentielScoreService.sendExportReferentielScore(
      collectiviteId,
      referentielId,
      snapshotRef,
      parameters,
      res,
      next
    );
  }

  @Delete(
    'collectivites/:collectivite_id/referentiels/:referentiel_id/score-snapshots/:snapshot_ref'
  )
  async deleteReferentielScoreSnapshot(
    @Param('collectivite_id') collectiviteId: number,
    @Param('referentiel_id') referentielId: ReferentielId,
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
