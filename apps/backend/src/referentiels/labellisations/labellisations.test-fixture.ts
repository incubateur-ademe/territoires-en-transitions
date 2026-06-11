import { bibliothequeFichierTable } from '@tet/backend/collectivites/documents/models/bibliotheque-fichier.table';
import { preuveLabellisationTable } from '@tet/backend/collectivites/documents/models/preuve-labellisation.table';
import { auditTable } from '@tet/backend/referentiels/labellisations/audit.table';
import { auditeurTable } from '@tet/backend/referentiels/labellisations/auditeur.table';
import { DatabaseServiceInterface } from '@tet/backend/utils/database/database-service.interface';
import { randomUUID } from 'node:crypto';
import { AppRouter } from '@tet/backend/utils/trpc/trpc.router';
import {
  Etoile,
  LabellisationDemande,
  ReferentielId,
} from '@tet/domain/referentiels';
import { TRPCClient } from '@trpc/client';
import { and, eq } from 'drizzle-orm';
import {
  cleanupReferentielActionStatutsAndLabellisations,
  updateAllNeedReferentielStatutsToCompleteReferentiel,
  updateAllNeedReferentielStatutsToMatchReferentielScoreCriteria,
} from '../update-action-statut/referentiel-action-statut.test-fixture';
import { labellisationDemandeTable } from './labellisation-demande.table';
import { labellisationTable } from './labellisation.table';

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

export async function validateAudit({
  databaseService,
  collectiviteId,
  referentielId,
}: {
  databaseService: DatabaseServiceInterface;
  collectiviteId: number;
  referentielId: ReferentielId;
}): Promise<void> {
  await databaseService.db
    .update(auditTable)
    .set({ valide: true })
    .where(
      and(
        eq(auditTable.collectiviteId, collectiviteId),
        eq(auditTable.referentielId, referentielId)
      )
    );
}

export async function seedLabellisationObtenue({
  databaseService,
  collectiviteId,
  referentielId,
  etoiles,
  obtenueLe,
}: {
  databaseService: DatabaseServiceInterface;
  collectiviteId: number;
  referentielId: ReferentielId;
  etoiles: Etoile;
  obtenueLe?: string;
}): Promise<void> {
  await databaseService.db.insert(labellisationTable).values({
    collectiviteId,
    referentiel: referentielId,
    etoiles,
    obtenueLe: obtenueLe ?? new Date().toISOString(),
  });
}

export async function validateAuditWithCnl({
  databaseService,
  auditId,
  cnlDate,
}: {
  databaseService: DatabaseServiceInterface;
  auditId: number;
  cnlDate: Date;
}) {
  await databaseService.db
    .update(auditTable)
    .set({
      dateCnl: cnlDate.toISOString(),
      valideLabellisation: true,
    })
    .where(eq(auditTable.id, auditId));
  console.log(
    `Audit ${auditId} validated with CNL on ${cnlDate.toISOString()}`
  );
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
): Promise<LabellisationDemande> {
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
  const requestLabellisationResponse =
    await trpcClient.referentiels.labellisations.requestLabellisation.mutate({
      referentiel,
      collectiviteId,
      sujet: 'labellisation',
      etoiles: parcours.etoiles,
    });
  return requestLabellisationResponse;
}

export async function seedLabellisationPreuve({
  trpcClient,
  databaseService,
  collectiviteId,
  referentielId,
  modifiedBy,
}: {
  trpcClient: TRPCClient<AppRouter>;
  databaseService: DatabaseServiceInterface;
  collectiviteId: number;
  referentielId: ReferentielId;
  modifiedBy: string;
}): Promise<void> {
  const parcours =
    await trpcClient.referentiels.labellisations.getParcours.query({
      collectiviteId,
      referentielId,
    });
  if (!parcours.demande) {
    throw new Error('Aucune demande à laquelle rattacher la preuve');
  }

  const [fichier] = await databaseService.db
    .insert(bibliothequeFichierTable)
    .values({
      collectiviteId,
      hash: randomUUID(),
      filename: 'test-preuve.pdf',
      confidentiel: false,
    })
    .returning();

  await databaseService.db.insert(preuveLabellisationTable).values({
    collectiviteId,
    demandeId: parcours.demande.id,
    fichierId: fichier.id,
    modifiedBy,
  });
}

export async function requestLabellisationAudit(
  trpcClient: TRPCClient<AppRouter>,
  collectiviteId: number,
  referentiel: ReferentielId
): Promise<LabellisationDemande> {
  const parcours =
    await trpcClient.referentiels.labellisations.getParcours.query({
      collectiviteId,
      referentielId: referentiel,
    });

  return trpcClient.referentiels.labellisations.requestLabellisation.mutate({
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
