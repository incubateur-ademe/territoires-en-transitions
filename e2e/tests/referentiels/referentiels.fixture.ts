import { addAuditeurPermission } from '@tet/backend/referentiels/labellisations/labellisations.test-fixture';
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
      userId: user.data.id,
    });
  }

  async requestCotAudit(
    user: UserFixture,
    collectiviteId: number,
    referentiel: ReferentielId
  ): Promise<void> {
    const trpcClient = user.getTrpcClient();
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

  async startAudit(
    auditUser: UserFixture,
    collectiviteId: number,
    referentielId: ReferentielId
  ): Promise<void> {
    const trpcClient = auditUser.getTrpcClient();
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
    const response = await trpcClient.referentiels.actions.updateStatut.mutate({
      actionStatut: actionStatut,
    });
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
