import { Injectable } from '@nestjs/common';
import { ReferentielModeGuard } from '@tet/backend/collectivites/collectivite-referentiel-mode/referentiel-mode-guard.service';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Result, failure, success } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import {
  LabellisationAudit,
  SnapshotJalonEnum,
} from '@tet/domain/referentiels';
import { eq } from 'drizzle-orm';
import { mapSnapshotsError } from '../../snapshots/snapshots.errors';
import { SnapshotsService } from '../../snapshots/snapshots.service';
import { auditTable } from '../audit.table';
import {
  ValidateAuditError,
  ValidateAuditErrorEnum,
} from './validate-audit.errors';

@Injectable()
export class ValidateAuditService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly snapshotsService: SnapshotsService,
    private readonly referentielModeGuard: ReferentielModeGuard,
    private readonly transactionManager: TransactionManager
  ) {}

  private readonly db = this.databaseService.db;

  // équivalent de la fonction PG `public.valider_audit()`
  async validateAudit({
    auditId,
  }: {
    auditId: number;
  }): Promise<Result<LabellisationAudit, ValidateAuditError>> {
    const audit = await this.db
      .select()
      .from(auditTable)
      .where(eq(auditTable.id, auditId))
      .then((rows) => rows[0]);

    if (!audit) {
      return failure(ValidateAuditErrorEnum.AUDIT_NOT_FOUND);
    }

    const modeResult = await this.referentielModeGuard.assertCanMutate(
      audit.collectiviteId,
      audit.referentielId
    );
    if (!modeResult.success) {
      return modeResult;
    }

    if (audit.valide) {
      return failure(ValidateAuditErrorEnum.AUDIT_ALREADY_VALIDATED);
    }

    return this.transactionManager.executeSingle(async (tx) => {
      const updated = await tx
        .update(auditTable)
        .set({ valide: true })
        .where(eq(auditTable.id, auditId))
        .returning()
        .then((rows) => rows[0]);

      const snapshotResult = await this.snapshotsService.computeAndUpsert(
        {
          collectiviteId: audit.collectiviteId,
          referentielId: audit.referentielId,
          jalon: SnapshotJalonEnum.POST_AUDIT,
          auditId: audit.id,
          date: updated.dateFin ?? undefined,
        },
        { tx }
      );

      if (!snapshotResult.success) {
        return mapSnapshotsError(snapshotResult, {
          snapshotSaveFailed: ValidateAuditErrorEnum.SNAPSHOT_COMPUTE_FAILED,
          defaultError: ValidateAuditErrorEnum.SNAPSHOT_COMPUTE_FAILED,
        });
      }

      return success(updated);
    });
  }
}
