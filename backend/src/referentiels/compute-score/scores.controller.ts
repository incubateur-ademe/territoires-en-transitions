import ActionStatutHistoryService from '@/backend/referentiels/compute-score/action-statut-history.service';
import { getReferentielScoresRequestSchema } from '@/backend/referentiels/models/get-referentiel-scores.request';
import { createZodDto } from '@anatine/zod-nestjs';
import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AllowAnonymousAccess } from '../../auth/decorators/allow-anonymous-access.decorator';
import { TokenInfo } from '../../auth/decorators/token-info.decorators';
import { AuthenticatedUser } from '../../auth/models/auth.models';
import { checkMultipleReferentielScoresRequestSchema } from '../models/check-multiple-referentiel-scores.request';
import { CheckReferentielScoresRequestType } from '../models/check-referentiel-scores.request';
import { getActionStatutsRequestSchema } from '../models/get-action-statuts.request';
import { GetCheckScoresResponseType } from '../models/get-check-scores.response';
import { GetMultipleCheckScoresResponseType } from '../models/get-multiple-check-scores.response';
import { ReferentielId } from '../models/referentiel-id.enum';
import { SnapshotsService } from '../snapshots/snapshots.service';
import { actionStatutsByActionIdSchema } from './action-statuts-by-action-id.dto';
import ScoresService from './scores.service';
class GetActionStatutsRequestClass extends createZodDto(
  getActionStatutsRequestSchema
) {}

class GetActionStatutsResponseClass extends createZodDto(
  actionStatutsByActionIdSchema
) {}

class CheckMultipleReferentielScoresRequestClass extends createZodDto(
  checkMultipleReferentielScoresRequestSchema
) {}

class GetReferentielScoresRequestClass extends createZodDto(
  getReferentielScoresRequestSchema
) {}

@ApiTags('Referentiels')
@Controller('')
export class ReferentielsScoringController {
  constructor(
    private readonly scoresService: ScoresService,
    private readonly snapshotsService: SnapshotsService,
    private readonly actionStatutHistoryService: ActionStatutHistoryService
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
    return this.scoresService.getReferentielActionStatuts(
      referentielId,
      collectiviteId,
      parameters.date,
      tokenInfo
    );
  }

  // TODO: À priori non utilisé. À supprimer après confirmation en prod.
  //
  // @AllowAnonymousAccess()
  // @Get('referentiels/:referentiel_id/scores')
  // @ApiResponse({ type: GetReferentielMultipleScoresResponseClass })
  // async getReferentielMultipleScorings(
  //   @Param('referentiel_id') referentielId: ReferentielId,
  //   @Query() parameters: GetReferentielMultipleScoresRequestClass,
  //   @TokenInfo() tokenInfo: AuthenticatedUser
  // ): Promise<GetReferentielMultipleScoresResponseClass> {
  //   return await this.scoresService.computeScoreForMultipleCollectivite(
  //     referentielId,
  //     parameters,
  //     tokenInfo
  //   );
  // }

  @AllowAnonymousAccess()
  @Get('collectivites/:collectivite_id/referentiels/:referentiel_id/scores')
  async getReferentielScoring(
    @Param('collectivite_id') collectiviteId: number,
    @Param('referentiel_id') referentielId: ReferentielId,
    @Query() parameters: GetReferentielScoresRequestClass,
    @TokenInfo() tokenInfo: AuthenticatedUser
  ) {
    return await this.scoresService.computeScoreForCollectivite(
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
    return await this.scoresService.checkScoreForCollectivite(
      referentielId,
      collectiviteId,
      parameters,
      checkReferentielHostUrl
    );
  }

  // TODO: À priori non utilisé. À supprimer après confirmation en prod.
  //
  // @AllowAnonymousAccess()
  // @Get(
  //   `collectivites/:${COLLECTIVITE_ID_PARAM_KEY}/referentiels/:${REFERENTIEL_ID_PARAM_KEY}/score-snapshots`
  // )
  // @ApiResponse({ type: GetScoreSnapshotsResponseClass })
  // async list(
  //   @Param(COLLECTIVITE_ID_PARAM_KEY) collectiviteId: number,
  //   @Param(REFERENTIEL_ID_PARAM_KEY) referentielId: ReferentielId,
  //   @Query() options: GetScoreSnapshotsRequestClass
  // ): Promise<GetScoreSnapshotsResponseClass> {
  //   return this.listSnapshots.list({
  //     collectiviteId,
  //     referentielId,
  //     options: {
  //       jalons: options.typesJalon,
  //     },
  //   });
  // }

  // TODO: À priori non utilisé. À supprimer après confirmation en prod.
  //
  // @AllowAnonymousAccess()
  // @Get(
  //   `collectivites/:${COLLECTIVITE_ID_PARAM_KEY}/referentiels/:${REFERENTIEL_ID_PARAM_KEY}/score-snapshots/:${SNAPSHOT_REF_PARAM_KEY}`
  // )
  // async getReferentielScoreSnapshot(
  //   @Param(COLLECTIVITE_ID_PARAM_KEY) collectiviteId: number,
  //   @Param(REFERENTIEL_ID_PARAM_KEY) referentielId: ReferentielId,
  //   @Param(SNAPSHOT_REF_PARAM_KEY) snapshotRef: string,
  //   @Query() parameters: GetScoreSnapshotRequestClass,
  //   @TokenInfo() tokenInfo: AuthenticatedUser
  // ) {
  //   if (snapshotRef === SnapshotsService.SCORE_COURANT_SNAPSHOT_REF) {
  //     return this.referentielsScoringService.getOrCreateCurrentScore(
  //       collectiviteId,
  //       referentielId,
  //       parameters.forceRecalculScoreCourant
  //     );
  //   } else {
  //     return this.referentielsScoringSnapshotsService.get(
  //       collectiviteId,
  //       referentielId,
  //       snapshotRef
  //     ) as Promise<ScoresPayload>;
  //   }
  // }

  // TODO: À priori non utilisé. À supprimer après confirmation en prod.
  //
  // @Delete(
  //   'collectivites/:collectivite_id/referentiels/:referentiel_id/score-snapshots/:snapshot_ref'
  // )
  // async deleteReferentielScoreSnapshot(
  //   @Param('collectivite_id') collectiviteId: number,
  //   @Param('referentiel_id') referentielId: ReferentielId,
  //   @Param('snapshot_ref') snapshotRef: string,
  //   @TokenInfo() tokenInfo: AuthUser
  // ): Promise<void> {
  //   return this.referentielsScoringSnapshotsService.delete(
  //     collectiviteId,
  //     referentielId,
  //     snapshotRef,
  //     tokenInfo
  //   );
  // }

  @AllowAnonymousAccess()
  @ApiExcludeEndpoint() // Not in documentation
  @Get('referentiels/all/check-last-scores')
  async checkLastReferentielsScore(
    @Query() parameters: CheckMultipleReferentielScoresRequestClass,
    @Req() req: Request
  ): Promise<GetMultipleCheckScoresResponseType> {
    const checkHostUrl = `${req.protocol}://${req.get('Host')}`;
    return await this.scoresService.checkScoreForLastModifiedCollectivite(
      parameters,
      checkHostUrl
    );
  }

  @AllowAnonymousAccess()
  @ApiExcludeEndpoint() // Not in documentation
  @Get('referentiels/all/save-last-scores')
  async saveLastReferentielsScoreNewTable() {
    // TODO: endpoint to be removed, only used during migration
    return await this.snapshotsService.convertOldScoresToSnapshots();
  }

  @AllowAnonymousAccess()
  @ApiExcludeEndpoint() // Not in documentation
  @Get('referentiels/all/fix-action-statuts-history')
  async fixActionStatutsHistory() {
    // TODO: endpoint to be removed once we are confident that all action statuts history are fixed
    return await this.actionStatutHistoryService.fixMissingActionStatutsHistory();
  }
}
