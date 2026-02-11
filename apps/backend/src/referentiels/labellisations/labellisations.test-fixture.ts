import { auditTable } from '@tet/backend/referentiels/labellisations/audit.table';
import { auditeurTable } from '@tet/backend/referentiels/labellisations/auditeur.table';
import { DatabaseServiceInterface } from '@tet/backend/utils/database/database-service.interface';
import { AppRouter } from '@tet/backend/utils/trpc/trpc.router';
import { ReferentielId } from '@tet/domain/referentiels';
import { TRPCClient } from '@trpc/client';
import { and, eq } from 'drizzle-orm';
import {
  cleanupReferentielActionStatutsAndLabellisations,
  updateAllNeedReferentielStatutsToCompleteReferentiel,
  updateAllNeedReferentielStatutsToMatchReferentielScoreCriteria,
} from '../update-action-statut/referentiel-action-statut.test-fixture';
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

export async function requestCotAudit(
  trpcClient: TRPCClient<AppRouter>,
  collectiviteId: number,
  referentiel: ReferentielId
): Promise<void> {
  // Fill referentiel
  await updateAllNeedReferentielStatutsToCompleteReferentiel(
    trpcClient,
    collectiviteId,
    referentiel
  );
  // Request audit
  await trpcClient.referentiels.labellisations.requestLabellisation.mutate({
    referentiel,
    collectiviteId,
    sujet: 'cot',
    etoiles: null,
  });
}

export async function requestLabellisationForCot(
  trpcClient: TRPCClient<AppRouter>,
  collectiviteId: number,
  referentiel: ReferentielId
): Promise<void> {
  // Fill referentiel
  await updateAllNeedReferentielStatutsToCompleteReferentiel(
    trpcClient,
    collectiviteId,
    referentiel
  );

  // Match score criteria
  await updateAllNeedReferentielStatutsToMatchReferentielScoreCriteria(
    trpcClient,
    collectiviteId,
    referentiel
  );

  // No need to upload file for cot
  const parcours =
    await trpcClient.referentiels.labellisations.getParcours.query({
      collectiviteId: collectiviteId,
      referentielId: referentiel,
    });

  // Request audit
  await trpcClient.referentiels.labellisations.requestLabellisation.mutate({
    referentiel,
    collectiviteId,
    sujet: 'labellisation',
    etoiles: parcours.etoiles,
  });
}

export async function startAudit(
  trpcClient: TRPCClient<AppRouter>,
  collectiviteId: number,
  referentielId: ReferentielId
): Promise<void> {
  const { audit } =
    await trpcClient.referentiels.labellisations.getParcours.query({
      collectiviteId,
      referentielId,
    });
  if (!audit) {
    throw new Error(
      `Audit not found for collectivite ${collectiviteId} and referentiel ${referentielId}`
    );
  }
  await trpcClient.referentiels.labellisations.startAudit.mutate({
    auditId: audit.id,
  });
}

export async function addAuditeur({
  trpcClient,
  databaseService,
  auditeurUserId,
  collectiviteId,
  referentielId,
}: {
  trpcClient: TRPCClient<AppRouter>;
  databaseService: DatabaseServiceInterface;
  auditeurUserId: string;
  collectiviteId: number;
  referentielId: ReferentielId;
}) {
  const { audit, status } =
    await trpcClient.referentiels.labellisations.getParcours.query({
      collectiviteId,
      referentielId,
    });

  if (!audit) {
    throw new Error(
      `Audit not found for collectivite ${collectiviteId} and referentiel ${referentielId}`
    );
  }
  console.log(`Audit ${audit.id} status: ${status}`);

  await addAuditeurPermission({
    databaseService,
    auditId: audit.id,
    userId: auditeurUserId,
  });
}
