import { Injectable } from '@nestjs/common';
import { ReferentielModeGuard } from '@tet/backend/collectivites/collectivite-referentiel-mode/referentiel-mode-guard.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import {
  canStartAudit,
  LabellisationAudit,
  SnapshotJalonEnum,
} from '@tet/domain/referentiels';
import { ResourceType } from '@tet/domain/users';
import { eq, sql } from 'drizzle-orm';
import { mapSnapshotsError } from '../../snapshots/snapshots.errors';
import { SnapshotsService } from '../../snapshots/snapshots.service';
import { auditTable } from '../audit.table';
import { GetLabellisationService } from '../get-labellisation.service';
import { StartAuditError, StartAuditErrorEnum } from './start-audit.errors';

@Injectable()
export class StartAuditService {
  constructor(
    private readonly snapshotsService: SnapshotsService,
    private readonly permissions: PermissionService,
    private readonly getLabellisationService: GetLabellisationService,
    private readonly referentielModeGuard: ReferentielModeGuard,
    private readonly transactionManager: TransactionManager
  ) {}

  // Équivalent de la fonction PG `labellisation_commencer_audit()`
  async startAudit({
    auditId,
    user,
  }: {
    user: AuthenticatedUser;
    auditId: number;
  }): Promise<Result<LabellisationAudit, StartAuditError>> {
    const isAllowed = await this.permissions.isAllowed(
      user,
      'referentiels.labellisations.start_audit',
      ResourceType.AUDIT,
      auditId,
      true
    );

    if (!isAllowed) {
      return failure(StartAuditErrorEnum.UNAUTHORIZED);
    }

    const audit = await this.getLabellisationService.getAudit(auditId);
    if (!audit.success) {
      return failure(audit.error);
    }

    const modeResult = await this.referentielModeGuard.assertCanMutate(
      audit.data.collectiviteId,
      audit.data.referentielId
    );
    if (!modeResult.success) {
      return modeResult;
    }

    const parcoursResult =
      await this.getLabellisationService.getParcoursLabellisation({
        collectiviteId: audit.data.collectiviteId,
        referentielId: audit.data.referentielId,
      });
    if (!parcoursResult.success) {
      return failure(
        StartAuditErrorEnum.DATABASE_ERROR,
        parcoursResult.cause ??
          new Error('Impossible de récupérer le parcours de labellisation')
      );
    }

    const canStartAuditResult = canStartAudit(parcoursResult.data, user.id);
    if (!canStartAuditResult.canRequest) {
      return failure(canStartAuditResult.reason);
    }

    // update audit `date_debut` et crée le snapshot pre_audit de façon atomique
    return this.transactionManager.executeSingle(async (tx) => {
      const started = await tx
        .update(auditTable)
        .set({ dateDebut: sql`now()` })
        .where(eq(auditTable.id, auditId))
        .returning()
        .then((rows) => rows[0]);

      const snapshotResult = await this.snapshotsService.computeAndUpsert(
        {
          collectiviteId: started.collectiviteId,
          referentielId: started.referentielId,
          jalon: SnapshotJalonEnum.PRE_AUDIT,
          auditId: started.id,
          date: started.dateDebut ?? undefined,
        },
        { tx }
      );

      if (!snapshotResult.success) {
        return mapSnapshotsError(snapshotResult, {
          snapshotSaveFailed: StartAuditErrorEnum.SNAPSHOT_COMPUTE_FAILED,
          defaultError: StartAuditErrorEnum.SNAPSHOT_COMPUTE_FAILED,
        });
      }

      return success(started);
    });
  }
}
