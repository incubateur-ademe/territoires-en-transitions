import { expect } from '@playwright/test';
import { ReferentielId } from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';
import { testWithReferentiels as test } from '../referentiels.fixture';

const referentiel: ReferentielId = 'eci';

test.describe('Start labellisation collectivité COT', () => {
  test.beforeEach(async ({ page, collectivites, referentiels }) => {
    const { collectivite, user: editeurUser } =
      await collectivites.addCollectiviteAndUser({
        userArgs: { autoLogin: true },
        collectiviteArgs: { isCOT: true },
      });
    await referentiels.requestLabellisationForCot(
      editeurUser,
      collectivite.data.id,
      referentiel
    );

    const auditeurUser = await collectivite.addUser({
      accessLevel: CollectiviteRole.LECTURE,
      autoLogin: true,
    });

    await referentiels.addAuditeur({
      user: auditeurUser,
      collectiviteId: collectivite.data.id,
      referentielId: referentiel,
    });

    await page.goto('/');
  });

  test("Possibilité de démarrer un audit pour l'auditeur, une fois que la demande de labellisation est soumise et l'auiteur attribué", async ({
    labellisationPom,
    collectivites,
    page,
  }) => {
    await labellisationPom.goto(referentiel);

    await expect(labellisationPom.startLabellisationAuditButton).toBeEnabled();
    await labellisationPom.startLabellisationAuditButton.click();
    await expect(labellisationPom.suiviLabellisationAuditTab).toBeVisible();

    // Vérifie que l'éditeur peut voir l'audit comme étant démarré
    const collectivite = collectivites.getCollectivite();
    const editeurUser = collectivite.getUser();
    await editeurUser.login();
    await page.goto('/');
    await labellisationPom.goto(referentiel);
    await expect(labellisationPom.suiviLabellisationAuditTab).toBeVisible();
    const auditeurUser = collectivite.getUser(1);
    await labellisationPom.checkAuditEnCoursWithAuditeur(auditeurUser);
  });
});
