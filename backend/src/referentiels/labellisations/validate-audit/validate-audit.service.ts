import { DatabaseService } from '@/backend/utils';
import { Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import ScoresService from '../../compute-score/scores.service';
import { ComputeScoreMode } from '../../models/compute-scores-mode.enum';
import { SnapshotJalon } from '../../snapshots/snapshot-jalon.enum';
import { Audit, auditTable } from '../audit.table';

@Injectable()
export class ValidateAuditService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly scoresService: ScoresService
  ) {}

  private readonly db = this.databaseService.db;

  // Équivalent de la fonction PG `public.valider_audit()`
  async validateAudit({ auditId }: { auditId: number }): Promise<Audit> {
    // Update audit to set valide=true
    // There is a PG trigger `labellisation.update_audit()` that update `date_fin` and `clos`
    const audit = await this.db
      .update(auditTable)
      .set({ valide: true })
      .where(eq(auditTable.id, auditId))
      .returning()
      .then((rows) => rows[0]);

    if (!audit) {
      throw new NotFoundException(`Audit ${auditId} non trouvé`);
    }

    // TODO it could be great to create a transaction containing the update of the audit and the creation of the snapshot,
    // it would be better for consistency but maybe it's too big an operation?

    // Crée un snapshot de 'post_audit'
    await this.scoresService.computeScoreForCollectivite(
      audit.referentiel,
      audit.collectiviteId,
      {
        mode: ComputeScoreMode.RECALCUL,
        auditId: audit.id,
        jalon: SnapshotJalon.POST_AUDIT,
        snapshot: true,
        snapshotForceUpdate: true,
      },
      undefined,
      undefined,
      true
    );

    return audit;
  }
}
