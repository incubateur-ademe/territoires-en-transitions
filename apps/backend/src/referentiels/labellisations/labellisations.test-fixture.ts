import { auditTable } from '@tet/backend/referentiels/labellisations/audit.table';
import { auditeurTable } from '@tet/backend/referentiels/labellisations/auditeur.table';
import { DatabaseServiceInterface } from '@tet/backend/utils/database/database-service.interface';
import { ReferentielId } from '@tet/domain/referentiels';
import { and, eq } from 'drizzle-orm';
import { cleanupReferentielActionStatutsAndLabellisations } from '../update-action-statut/referentiel-action-statut.test-fixture';
import { labellisationDemandeTable } from './labellisation-demande.table';

export async function createAudit({
  databaseService,
  collectiviteId,
  referentielId,
  dateDebut = new Date('2025-01-01').toISOString(),
  clos = false,
  withDemande = false,
}: {
  databaseService: DatabaseServiceInterface;
  collectiviteId: number;
  referentielId: ReferentielId;
  dateDebut?: string | null;
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
      dateDebut: dateDebut,
      clos,
      dateFin: clos ? new Date().toISOString() : null,
    })
    .returning();

  const cleanup = async () => {
    await cleanupReferentielActionStatutsAndLabellisations(
      databaseService,
      collectiviteId
    );
  };

  return { audit, demande, cleanup };
}

export async function addAuditeurPermission({
  databaseService,
  auditId,
  userId,
}: {
  databaseService: DatabaseServiceInterface;
  auditId: number;
  userId: string;
}) {
  // Ajoute le droit d'auditeur sur l'audit en cours
  await databaseService.db.insert(auditeurTable).values({
    auditId,
    auditeur: userId,
  });
  console.log(`Auditeur ${userId} added to audit ${auditId}`);

  return {
    cleanup: async () => {
      await databaseService.db
        .delete(auditeurTable)
        .where(
          and(
            eq(auditeurTable.auditId, auditId),
            eq(auditeurTable.auditeur, userId)
          )
        );
    },
  };
}
