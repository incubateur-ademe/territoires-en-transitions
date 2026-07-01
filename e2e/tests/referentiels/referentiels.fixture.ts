import { auditTable } from '@tet/backend/referentiels/labellisations/audit.table';
import {
  addAuditeur,
  requestCotAudit,
  requestLabellisationAudit,
  requestLabellisationForCot,
  seedLabellisationObtenue,
  seedLabellisationPreuve,
  setAuditDateFin,
  startAudit,
  validateAudit,
} from '@tet/backend/referentiels/labellisations/labellisations.test-fixture';
import { and, desc, eq } from 'drizzle-orm';
import {
  cleanupReferentielActionStatutsAndLabellisations,
  updateAllNeedReferentielStatutsToCompleteReferentiel,
  updateAllNeedReferentielStatutsToMatchReferentielScoreCriteria,
  updateAllReferentielStatutsToFait,
} from '@tet/backend/referentiels/update-action-statut/referentiel-action-statut.test-fixture';
import {
  ActionStatutCreate,
  AUDIT_REPORT_UPDATE_WINDOW_DAYS,
  AuditLabellisationReferentielId,
  Etoile,
  ReferentielId,
  ROLE_IDENTIFIANTS,
  ScoreSnapshot,
} from '@tet/domain/referentiels';
import type { CollectiviteReferentielPreferences } from '@tet/domain/collectivites';
import { testWithCollectivites } from 'tests/collectivite/collectivites.fixture';
import { databaseService } from 'tests/shared/database.service';
import { setupTrpcClient } from 'tests/shared/trpc.utils';
import { FixtureFactory } from 'tests/shared/fixture-factory.interface';
import { UserFixture } from 'tests/users/users.fixture';
import { LabellisationPom } from './labellisations/labellisation.pom';
import { NewAuditLabellisationPom } from './labellisations/new-audit-labellisation.pom';
import { ReferentielScoresPom } from './scores/referentiel-scores.pom';

class ReferentielsFixtureFactory extends FixtureFactory {
  async updateAllNeedReferentielStatutsToCompleteReferentiel(
    user: UserFixture,
    collectiviteId: number,
    referentiel: ReferentielId
  ): Promise<void> {
    const trpcClient = user.getTrpcClient();
    await updateAllNeedReferentielStatutsToCompleteReferentiel(
      trpcClient,
      collectiviteId,
      referentiel
    );
  }

  async updateAllReferentielStatutsToFait(
    user: UserFixture,
    collectiviteId: number,
    referentiel: ReferentielId
  ): Promise<void> {
    const trpcClient = user.getTrpcClient();
    await updateAllReferentielStatutsToFait(
      trpcClient,
      collectiviteId,
      referentiel
    );
  }

  async addAuditeur({
    user,
    auditeurUserId,
    collectiviteId,
    referentielId,
  }: {
    user: UserFixture;
    auditeurUserId?: string;
    collectiviteId: number;
    referentielId: ReferentielId;
  }) {
    const trpcClient = user.getTrpcClient();
    await addAuditeur({
      trpcClient,
      databaseService,
      auditeurUserId: auditeurUserId ?? user.data.id,
      collectiviteId,
      referentielId,
    });
  }

  async requestCotAudit(
    user: UserFixture,
    collectiviteId: number,
    referentiel: ReferentielId
  ): Promise<void> {
    const trpcClient = user.getTrpcClient();
    await requestCotAudit(trpcClient, collectiviteId, referentiel);
  }

  async requestLabellisationForCot(
    user: UserFixture,
    collectiviteId: number,
    referentiel: ReferentielId
  ): Promise<void> {
    const trpcClient = user.getTrpcClient();
    await requestLabellisationForCot(trpcClient, collectiviteId, referentiel);
  }

  async startAudit(
    auditUser: UserFixture,
    collectiviteId: number,
    referentielId: ReferentielId
  ): Promise<void> {
    const trpcClient = auditUser.getTrpcClient();
    await startAudit(trpcClient, collectiviteId, referentielId);
  }

  async validateAudit(
    collectiviteId: number,
    referentielId: ReferentielId
  ): Promise<void> {
    const [audit] = await databaseService.db
      .select({ id: auditTable.id })
      .from(auditTable)
      .where(
        and(
          eq(auditTable.collectiviteId, collectiviteId),
          eq(auditTable.referentielId, referentielId)
        )
      )
      .orderBy(desc(auditTable.id))
      .limit(1);
    if (!audit) {
      throw new Error(
        `Aucun audit a valider pour la collectivite ${collectiviteId} (${referentielId})`
      );
    }
    await validateAudit({ databaseService, auditId: audit.id });
  }

  async requestLabellisationAudit(
    user: UserFixture,
    collectiviteId: number,
    referentiel: ReferentielId
  ): Promise<void> {
    const trpcClient = user.getTrpcClient();
    await requestLabellisationAudit(trpcClient, collectiviteId, referentiel);
  }

  async seedLabellisationPreuve(
    user: UserFixture,
    collectiviteId: number,
    referentielId: ReferentielId
  ): Promise<void> {
    await seedLabellisationPreuve({
      trpcClient: user.getTrpcClient(),
      databaseService,
      collectiviteId,
      referentielId,
      modifiedBy: user.data.id,
    });
  }

  async expireAuditReportEditWindow({
    collectiviteId,
    referentielId,
  }: {
    collectiviteId: number;
    referentielId: ReferentielId;
  }): Promise<void> {
    const dayInMs = 24 * 60 * 60 * 1000;
    const dateFin = new Date(
      Date.now() - (AUDIT_REPORT_UPDATE_WINDOW_DAYS + 1) * dayInMs
    );
    await setAuditDateFin({
      databaseService,
      collectiviteId,
      referentielId,
      dateFin,
    });
  }

  async updateAllNeedReferentielStatutsToMatchReferentielScoreCriteria(
    user: UserFixture,
    collectiviteId: number,
    referentiel: ReferentielId
  ): Promise<void> {
    const trpcClient = user.getTrpcClient();
    await updateAllNeedReferentielStatutsToMatchReferentielScoreCriteria(
      trpcClient,
      collectiviteId,
      referentiel
    );
  }

  async seedLabellisationObtenue({
    collectiviteId,
    referentielId,
    etoiles,
    obtenueLe,
  }: {
    collectiviteId: number;
    referentielId: ReferentielId;
    etoiles: Etoile;
    obtenueLe?: string;
  }): Promise<void> {
    await seedLabellisationObtenue({
      databaseService,
      collectiviteId,
      referentielId,
      etoiles,
      obtenueLe,
    });
  }

  async seedRolePilotes(
    user: UserFixture,
    collectiviteId: number,
    referentielId: AuditLabellisationReferentielId
  ): Promise<void> {
    const trpcClient = user.getTrpcClient();
    const { eluReferent, referentTechnique } = ROLE_IDENTIFIANTS[referentielId];
    await Promise.all(
      [eluReferent, referentTechnique].map((identifiant) =>
        trpcClient.referentiels.actions.upsertPilotes.mutate({
          collectiviteId,
          mesureId: `${referentielId}_${identifiant}`,
          pilotes: [{ userId: user.data.id }],
        })
      )
    );
  }

  async updateActionStatut(
    user: UserFixture,
    actionStatut: ActionStatutCreate
  ): Promise<ScoreSnapshot> {
    const trpcClient = user.getTrpcClient();
    const response = await trpcClient.referentiels.actions.updateStatut.mutate(
      actionStatut
    );
    return response;
  }

  async setReferentielPreferences(
    supportUser: UserFixture,
    collectiviteId: number,
    referentiels: CollectiviteReferentielPreferences
  ): Promise<void> {
    const { accessToken } = await supportUser.supabaseClient.authenticateUser(
      supportUser.data.email,
      supportUser.data.password
    );
    const trpcClient = setupTrpcClient(accessToken);

    await trpcClient.users.authorizations.toggleSuperAdminRole.mutate({
      isEnabled: true,
    });

    await trpcClient.collectivites.preferences.update.mutate({
      collectiviteId,
      preferences: { referentiels },
    });

    await trpcClient.users.authorizations.toggleSuperAdminRole.mutate({
      isEnabled: false,
    });
  }

  async cleanupByCollectiviteId(collectiviteId: number): Promise<void> {
    await cleanupReferentielActionStatutsAndLabellisations(
      databaseService,
      collectiviteId
    );
  }
}

export const testWithReferentiels = testWithCollectivites.extend<{
  referentiels: ReferentielsFixtureFactory;
  labellisationPom: LabellisationPom;
  newAuditLabellisationPom: NewAuditLabellisationPom;
  referentielScoresPom: ReferentielScoresPom;
}>({
  referentiels: async ({ collectivites }, use) => {
    const referentiels = new ReferentielsFixtureFactory();
    collectivites.registerCleanupFunc(referentiels);
    await use(referentiels);
  },
  labellisationPom: async ({ page }, use) => {
    const labellisationPom = new LabellisationPom(page);
    await use(labellisationPom);
  },
  newAuditLabellisationPom: async ({ page }, use) => {
    const pom = new NewAuditLabellisationPom(page);
    await use(pom);
  },
  referentielScoresPom: async ({ page }, use) => {
    const referentielScoresPom = new ReferentielScoresPom(page);
    await use(referentielScoresPom);
  },
});
