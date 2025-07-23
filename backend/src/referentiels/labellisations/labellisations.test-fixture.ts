import { auditTable } from '@/backend/referentiels/labellisations/audit.table';
import { auditeurTable } from '@/backend/referentiels/labellisations/auditeur.table';
import { mesureAuditStatutTable } from '@/backend/referentiels/labellisations/handle-mesure-audit-statut/mesure-audit-statut.table';
import { ReferentielId } from '@/backend/referentiels/models/referentiel-id.enum';
import { DatabaseService } from '@/backend/utils/database/database.service';
import { eq } from 'drizzle-orm';
import { onTestFinished } from 'vitest';

export async function createAudit({
  databaseService,
  collectiviteId,
  referentielId,
  clos = false,
  withAuditeurId,
}: {
  databaseService: DatabaseService;
  collectiviteId: number;
  referentielId: ReferentielId;
  clos?: boolean;
  withAuditeurId?: string;
}) {
  const [audit] = await databaseService.db
    .insert(auditTable)
    .values({
      collectiviteId,
      referentielId,
      dateDebut: new Date().toISOString(),
      clos,
      valide: clos ? false : true,
      dateFin: clos ? new Date().toISOString() : null,
    })
    .returning();

  if (withAuditeurId) {
    await databaseService.db.insert(auditeurTable).values({
      auditId: audit.id,
      auditeur: withAuditeurId,
    });
  }

  onTestFinished(async () => {
    await databaseService.db
      .delete(auditeurTable)
      .where(eq(auditeurTable.auditId, audit.id));

    await databaseService.db
      .delete(mesureAuditStatutTable)
      .where(eq(mesureAuditStatutTable.auditId, audit.id));

    await databaseService.db
      .delete(auditTable)
      .where(eq(auditTable.id, audit.id));
  });

  return audit;
}
