import { DatabaseService } from '@/backend/utils/database/database.service';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { SnapshotJalonEnum } from '../../snapshots/snapshot-jalon.enum';
import { SnapshotsService } from '../../snapshots/snapshots.service';
import { Audit, auditTable } from '../audit.table';
import { labellisationDemandeTable } from '../labellisation-demande.table';

@Injectable()
export class StartAuditService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly snapshotsService: SnapshotsService
  ) {}

  private readonly db = this.databaseService.db;

  // Équivalent de la fonction PG `labellisation_commencer_audit()`
  async startAudit({ auditId }: { auditId: number }): Promise<Audit> {
    // Check if demande is not `en_cours`
    const demande = await this.db
      .select({
        enCours: labellisationDemandeTable.enCours,
      })
      .from(auditTable)
      .innerJoin(
        labellisationDemandeTable,
        eq(auditTable.demandeId, labellisationDemandeTable.id)
      )
      .where(eq(auditTable.id, auditId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!demande) {
      throw new NotFoundException(`Audit ${auditId} non trouvé`);
    }

    if (demande.enCours) {
      throw new ConflictException(
        "La demande liée à l'audit est toujours en cours, elle n'a pas été soumise, l'audit ne peut donc pas commencer."
      );
    }

    // Update audit `date_debut`
    const startedAudit = await this.db
      .update(auditTable)
      .set({ dateDebut: sql`now()` })
      .where(eq(auditTable.id, auditId))
      .returning()
      .then((rows) => rows[0]);

    // TODO it could be great to create a transaction containing the update of the audit and the creation of the snapshot,
    // it would be better for consistency but maybe it's too big an operation?

    // Crée un snapshot de 'pre_audit'
    await this.snapshotsService.computeAndUpsert({
      collectiviteId: startedAudit.collectiviteId,
      referentielId: startedAudit.referentielId,
      jalon: SnapshotJalonEnum.PRE_AUDIT,
      auditId: startedAudit.id,
    });

    //     mode: ComputeScoreMode.RECALCUL,
    //     auditId: startedAudit.id,
    //     jalon: SnapshotJalonEnum.PRE_AUDIT,
    //     snapshot: true,
    //     snapshotForceUpdate: true,
    //   },
    //   undefined,
    //   undefined,
    //   true
    // );

    return startedAudit;
  }
}
