import { DatabaseService } from '@/backend/utils/database/database.service';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { SnapshotJalonEnum } from '../../snapshots/snapshot-jalon.enum';
import { SnapshotsService } from '../../snapshots/snapshots.service';
import { Audit, auditTable } from '../audit.table';

@Injectable()
export class ValidateAuditService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly snapshotsService: SnapshotsService
  ) {}

  private readonly db = this.databaseService.db;

  // Équivalent de la fonction PG `public.valider_audit()`
  async validateAudit({ auditId }: { auditId: number }): Promise<Audit> {
    // Update audit to set valide=true
    // There is a PG trigger `labellisation.update_audit()` that update `date_fin` and `clos`
    // TODO: Modifier la fonction labellisation.update_labellisation() coalesce
    const audit = await this.db
      .select()
      .from(auditTable)
      .where(eq(auditTable.id, auditId))
      .then((rows) => rows[0]);

    if (!audit) {
      throw new NotFoundException(`Audit ${auditId} non trouvé`);
    }

    if (audit.valide) {
      throw new BadRequestException(`L'audit ${auditId} pour la collectivité ${audit.collectiviteId} et le referentiel ${audit.referentielId} a déjà été validé`);
    }

    const updatedAuditFields: Partial<Audit> = {
      valide: true,
    };
    const updatedAudit = await this.db
      .update(auditTable)
      .set(updatedAuditFields)
      .where(eq(auditTable.id, auditId))
      .returning()
      .then((rows) => rows[0]);


    // TODO it could be great to create a transaction containing the update of the audit and the creation of the snapshot,
    // it would be better for consistency but maybe it's too big an operation?

    // Crée un snapshot de 'post_audit'
    await this.snapshotsService.computeAndUpsert({
      collectiviteId: audit.collectiviteId,
      referentielId: audit.referentielId,
      jalon: SnapshotJalonEnum.POST_AUDIT,
      auditId: audit.id,

    });

    return updatedAudit;
  }
}
