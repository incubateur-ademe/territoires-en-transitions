import { auditTable } from '@/backend/referentiels/labellisations/audit.table';
import { auditeurTable } from '@/backend/referentiels/labellisations/auditeur.table';
import { mesureAuditStatutTable } from '@/backend/referentiels/labellisations/handle-mesure-audit-statut/mesure-audit-statut.table';
import { DatabaseService } from '@/backend/utils/database/database.service';
import { ReferentielId } from '@/domain/referentiels';
import { eq } from 'drizzle-orm';
import { onTestFinished } from 'vitest';
import { labellisationDemandeTable } from './labellisation-demande.table';

export async function createAudit({
  databaseService,
  collectiviteId,
  referentielId,
  clos = false,
  withDemande = false,
}: {
  databaseService: DatabaseService;
  collectiviteId: number;
  referentielId: ReferentielId;
  clos?: boolean;
  withDemande?: boolean;
}) {
  const demande = withDemande
    ? await databaseService.db
        .insert(labellisationDemandeTable)
        .values({
          collectiviteId,
          referentiel: referentielId,
          enCours: false,
          sujet: 'cot',
          date: new Date().toISOString(),
        })
        .returning()
        .then((rows) => rows[0])
    : null;

  const [audit] = await databaseService.db
    .insert(auditTable)
    .values({
      collectiviteId,
      referentielId,
      demandeId: demande ? demande.id : null,
      dateDebut: new Date('2025-01-01').toISOString(),
      clos,
      dateFin: clos ? new Date().toISOString() : null,
    })
    .returning();

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

    if (demande) {
      await databaseService.db
        .delete(labellisationDemandeTable)
        .where(eq(labellisationDemandeTable.id, demande.id));
    }
  });

  return { audit, demande };
}

export async function addAuditeurPermission({
  databaseService,
  auditId,
  userId,
}: {
  databaseService: DatabaseService;
  auditId: number;
  userId: string;
}) {
  // Ajoute le droit d'auditeur sur l'audit en cours
  await databaseService.db.insert(auditeurTable).values({
    auditId,
    auditeur: userId,
  });
}
