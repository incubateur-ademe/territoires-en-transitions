import {
  addAuditeur,
  requestCotAudit,
  startAudit,
} from '@tet/backend/referentiels/labellisations/labellisations.test-fixture';
import {
  cleanupReferentielActionStatutsAndLabellisations,
  updateAllNeedReferentielStatutsToCompleteReferentiel,
  updateAllNeedReferentielStatutsToMatchReferentielScoreCriteria,
} from '@tet/backend/referentiels/update-action-statut/referentiel-action-statut.test-fixture';
import {
  ActionStatutCreate,
  ReferentielId,
  ScoreSnapshot,
} from '@tet/domain/referentiels';
import { testWithCollectivites } from 'tests/collectivite/collectivites.fixture';
import { databaseService } from 'tests/shared/database.service';
import { FixtureFactory } from 'tests/shared/fixture-factory.interface';
import { UserFixture } from 'tests/users/users.fixture';
import { LabellisationPom } from './labellisations/labellisation.pom';
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

  async addAuditeur({
    user,
    collectiviteId,
    referentielId,
  }: {
    user: UserFixture;
    collectiviteId: number;
    referentielId: ReferentielId;
  }) {
    const trpcClient = user.getTrpcClient();
    await addAuditeur({
      trpcClient,
      databaseService,
      auditeurUserId: user.data.id,
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

  async startAudit(
    auditUser: UserFixture,
    collectiviteId: number,
    referentielId: ReferentielId
  ): Promise<void> {
    const trpcClient = auditUser.getTrpcClient();
    await startAudit(trpcClient, collectiviteId, referentielId);
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
  referentielScoresPom: async ({ page }, use) => {
    const referentielScoresPom = new ReferentielScoresPom(page);
    await use(referentielScoresPom);
  },
});
