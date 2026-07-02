import { Injectable } from '@nestjs/common';
import { ReferentielModeGuard } from '@tet/backend/collectivites/collectivite-referentiel-mode/referentiel-mode-guard.service';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Result, failure, success } from '@tet/backend/utils/result.type';
import {
  LabellisationAudit,
  SnapshotJalonEnum,
} from '@tet/domain/referentiels';
import { getErrorMessage } from '@tet/domain/utils';
import { eq } from 'drizzle-orm';
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
    private readonly referentielModeGuard: ReferentielModeGuard
  ) {}

  private readonly db = this.databaseService.db;

  // équivalent de la fonction PG `public.valider_audit()`
  async validateAudit({
    auditId,
  }: {
    auditId: number;
  }): Promise<Result<LabellisationAudit, ValidateAuditError>> {
    try {
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

      const updatedAudit = await this.databaseService.db.transaction(
        async (tx) => {
          const updatedAuditFields: Partial<LabellisationAudit> = {
            valide: true,
          };
          const updated = await tx
            .update(auditTable)
            .set(updatedAuditFields)
            .where(eq(auditTable.id, auditId))
            .returning()
            .then((rows) => rows[0]);

          await this.snapshotsService.computeAndUpsert({
            collectiviteId: audit.collectiviteId,
            referentielId: audit.referentielId,
            jalon: SnapshotJalonEnum.POST_AUDIT,
            auditId: audit.id,
            date: updated.dateFin ?? undefined,
            tx,
          });

          return updated;
        }
      );

      return success(updatedAudit);
    } catch (error) {
      return failure(
        ValidateAuditErrorEnum.DATABASE_ERROR,
        error instanceof Error ? error : new Error(getErrorMessage(error))
      );
    }
  }
}
