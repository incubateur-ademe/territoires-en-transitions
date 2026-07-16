import { Injectable, Logger } from '@nestjs/common';
import { actionStatutCreateToActionStatutInDatabase } from '@tet/backend/referentiels/update-action-statut/action-statut-create-to-action-statut-in-database.adapter';
import { type Transaction } from '@tet/backend/utils/database/transaction.utils';
import type { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { type CollectiviteReferentielPreferences } from '@tet/domain/collectivites';
import {
  ReferentielIdEnum,
  type ActionCommentaireCreate,
  type ActionStatutCreate,
  type ScoreSnapshot,
} from '@tet/domain/referentiels';
import { getErrorMessage } from '@tet/domain/utils';
import { BuildSwitchToTeContextService } from '../build-switch-to-te-context.service';
import { mergeCommentaires } from '../merge-commentaires/merge-commentaires.rules';
import { mergeFicheActionLinks } from '../merge-fiche-action-links/merge-fiche-action-links.rules';
import { mergePilotes } from '../merge-pilotes/merge-pilotes.rules';
import { mergeServices } from '../merge-services/merge-services.rules';
import { mergeStatuts } from '../merge-statuts/merge-statuts.rules';
import {
  SwitchToTeErrorEnum,
  type SwitchToTeError,
} from '../switch-to-te.errors';
import {
  MigrateCollectiviteDataRepository,
  type ActionCommentaireInsertRow,
  type ActionStatutInsertRow,
} from './migrate-collectivite-data.repository';

@Injectable()
export class MigrateCollectiviteDataService {
  private readonly logger = new Logger(MigrateCollectiviteDataService.name);

  constructor(
    private readonly migrateCollectiviteDataRepository: MigrateCollectiviteDataRepository,
    private readonly buildSwitchToTeContextService: BuildSwitchToTeContextService
  ) {}

  async migrate(
    collectiviteId: number,
    prefs: CollectiviteReferentielPreferences,
    preSwitchSnapshots: ScoreSnapshot[],
    // tx obligatoire : les 5 inserts doivent être atomiques dans la transaction
    // de l'appelant
    { user, tx }: ServiceSecondArg & { tx: Transaction }
  ): Promise<Result<void, SwitchToTeError>> {
    const hasTeData =
      await this.migrateCollectiviteDataRepository.hasCollectiviteReferentielData(
        collectiviteId,
        ReferentielIdEnum.TE,
        tx
      );

    if (hasTeData) {
      return failure(SwitchToTeErrorEnum.REFERENTIEL_TE_NOT_EMPTY);
    }

    const ctxResult = await this.buildSwitchToTeContextService.build(
      collectiviteId,
      prefs,
      preSwitchSnapshots,
      { user }
    );

    if (!ctxResult.success) {
      return ctxResult;
    }

    const ctx = ctxResult.data;
    const statutRows = this.toStatutInsertRows(mergeStatuts(ctx), user.id);
    const commentaireRows = this.toCommentaireInsertRows(
      mergeCommentaires(ctx),
      user.id
    );
    const piloteRows = mergePilotes(ctx);
    const serviceRows = mergeServices(ctx);
    const ficheLinkRows = mergeFicheActionLinks(ctx);

    try {
      await this.migrateCollectiviteDataRepository.insertStatuts(
        statutRows,
        tx
      );
      await this.migrateCollectiviteDataRepository.insertCommentaires(
        commentaireRows,
        tx
      );
      await this.migrateCollectiviteDataRepository.insertPilotes(
        piloteRows,
        tx
      );
      await this.migrateCollectiviteDataRepository.insertServices(
        serviceRows,
        tx
      );
      await this.migrateCollectiviteDataRepository.insertFicheLinks(
        ficheLinkRows,
        tx
      );
    } catch (error) {
      this.logger.error(
        `Migration TE échouée pour la collectivité ${collectiviteId}: ${getErrorMessage(
          error
        )}`
      );
      return failure(
        SwitchToTeErrorEnum.MIGRATION_FAILED,
        error instanceof Error ? error : new Error(getErrorMessage(error))
      );
    }

    return success(undefined);
  }

  private toStatutInsertRows(
    statuts: ActionStatutCreate[],
    modifiedBy: string
  ): ActionStatutInsertRow[] {
    const modifiedAt = new Date().toISOString();
    return [...statuts]
      .sort((a, b) => a.actionId.localeCompare(b.actionId))
      .map((statut) => ({
        collectiviteId: statut.collectiviteId,
        actionId: statut.actionId,
        modifiedBy,
        modifiedAt,
        ...actionStatutCreateToActionStatutInDatabase(statut),
      }));
  }

  private toCommentaireInsertRows(
    commentaires: ActionCommentaireCreate[],
    modifiedBy: string
  ): ActionCommentaireInsertRow[] {
    const modifiedAt = new Date().toISOString();
    return commentaires.map((commentaire) => ({
      collectiviteId: commentaire.collectiviteId,
      actionId: commentaire.actionId,
      commentaire: commentaire.commentaire,
      modifiedBy,
      modifiedAt,
    }));
  }
}
