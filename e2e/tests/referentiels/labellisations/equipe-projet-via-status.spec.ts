import { expect } from '@playwright/test';
import { ReferentielId } from '@tet/domain/referentiels';
import { testWithReferentiels as test } from '../referentiels.fixture';

const referentiel: ReferentielId = 'eci';
const equipeProjetActionId = 'eci_1.1.3.1';

test.describe(
  "Checklist audit-labellisation — « Mettre en place une équipe projet » pilotée par le statut",
  () => {
    test(
      "passer la mesure à « fait » fait basculer le critère à atteint",
      async ({ collectivites, referentiels, newAuditLabellisationPom }) => {
        const { collectivite, user } =
          await collectivites.addCollectiviteAndUser({
            userArgs: { autoLogin: true },
          });
        const collectiviteId = collectivite.data.id;
        await user.precomputeReferentielSnapshot(collectiviteId, referentiel);

        await newAuditLabellisationPom.goto(collectiviteId, referentiel);

        const row = newAuditLabellisationPom.checklistRow(
          /Mettre en place une équipe projet/i
        );
        await expect(row.getByLabel('Critère non atteint')).toBeVisible();

        await referentiels.updateActionStatut(user, {
          collectiviteId,
          actionId: equipeProjetActionId,
          statut: 'fait',
        });

        await newAuditLabellisationPom.goto(collectiviteId, referentiel);
        await expect(row.getByLabel('Critère atteint')).toBeVisible({
          timeout: 15_000,
        });
      }
    );
  }
);
