import { Injectable } from '@nestjs/common';
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
    private readonly getLabellisationService: GetLabellisationService
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

      // Update audit `date_debut`
      const startedAuditRows = await this.db
        .update(auditTable)
        .set({ dateDebut: sql`now()` })
        .where(eq(auditTable.id, auditId))
        .returning();
      if (!startedAuditRows.length) {
        return {
          success: false,
          error: StartAuditErrorEnum.AUDIT_NOT_FOUND,
        };
      }
      const startedAudit = startedAuditRows[0];

      // TODO it could be great to create a transaction containing the update of the audit and the creation of the snapshot,
      // it would be better for consistency but maybe it's too big an operation?

      // Crée un snapshot de 'pre_audit'
      await this.snapshotsService.computeAndUpsert({
        collectiviteId: startedAudit.collectiviteId,
        referentielId: startedAudit.referentielId,
        jalon: SnapshotJalonEnum.PRE_AUDIT,
        auditId: startedAudit.id,
      });

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
