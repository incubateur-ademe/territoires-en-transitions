import { Injectable } from '@nestjs/common';
import { ReferentielModeGuard } from '@tet/backend/collectivites/collectivite-referentiel-mode/referentiel-mode-guard.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Result } from '@tet/backend/utils/result.type';
import {
  canStartAudit,
  LabellisationAudit,
  SnapshotJalonEnum,
} from '@tet/domain/referentiels';
import { ResourceType } from '@tet/domain/users';
import { getErrorMessage } from '@tet/domain/utils';
import { eq, sql } from 'drizzle-orm';
import { SnapshotsService } from '../../snapshots/snapshots.service';
import { auditTable } from '../audit.table';
import { GetLabellisationService } from '../get-labellisation.service';
import { StartAuditError, StartAuditErrorEnum } from './start-audit.errors';

@Injectable()
export class StartAuditService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly snapshotsService: SnapshotsService,
    private readonly permissions: PermissionService,
    private readonly getLabellisationService: GetLabellisationService,
    private readonly referentielModeGuard: ReferentielModeGuard
  ) {}

  private readonly db = this.databaseService.db;

  // Équivalent de la fonction PG `labellisation_commencer_audit()`
  async startAudit({
    auditId,
    user,
  }: {
    user: AuthenticatedUser;
    auditId: number;
  }): Promise<Result<LabellisationAudit, StartAuditError>> {
    try {
      const isAllowed = await this.permissions.isAllowed(
        user,
        'referentiels.labellisations.start_audit',
        ResourceType.AUDIT,
        auditId,
        true
      );

      if (!isAllowed) {
        return {
          success: false,
          error: StartAuditErrorEnum.UNAUTHORIZED,
        };
      }

      const audit = await this.getLabellisationService.getAudit(auditId);
      if (!audit.success) {
        return {
          success: false,
          error: audit.error,
        };
      }

      const modeResult = await this.referentielModeGuard.assertCanMutate(
        audit.data.collectiviteId,
        audit.data.referentielId
      );
      if (!modeResult.success) {
        return modeResult;
      }

      const parcours =
        await this.getLabellisationService.getParcoursLabellisation({
          collectiviteId: audit.data.collectiviteId,
          referentielId: audit.data.referentielId,
        });

      const canStartAuditResult = canStartAudit(parcours, user.id);
      if (!canStartAuditResult.canRequest) {
        return {
          success: false,
          error: canStartAuditResult.reason,
        };
      }

      // Update audit `date_debut` et crée le snapshot pre_audit de façon atomique
      const startedAudit = await this.databaseService.db.transaction(
        async (tx) => {
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
            throw (
              snapshotResult.cause ??
              new Error('Impossible de créer le snapshot pre-audit')
            );
          }

          return started;
        }
      );

      return {
        success: true,
        data: startedAudit,
      };
    } catch (error) {
      return {
        success: false,
        error: StartAuditErrorEnum.DATABASE_ERROR,
        cause:
          error instanceof Error ? error : new Error(getErrorMessage(error)),
      };
    }
  }
}
