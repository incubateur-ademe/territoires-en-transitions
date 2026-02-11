import { expect } from '@playwright/test';
import { ReferentielId } from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';
import { testWithReferentiels as test } from '../referentiels.fixture';

const referentiel: ReferentielId = 'eci';

test.describe('Validate labellisation collectivité COT', () => {
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

    await referentiels.startAudit(
      auditeurUser,
      collectivite.data.id,
      referentiel
    );

    await page.goto('/');
  });

  test('Possibilité de valider un audit une fois démarré en déposant un rapport', async ({
    labellisationPom,
    collectivites,
  }) => {
    const auditeurUser = collectivites.getCollectivite().getUser(1);
    await labellisationPom.goto(referentiel);

    await expect(labellisationPom.validateAuditButton).toBeEnabled();
    await labellisationPom.validateAuditButton.click();

    await expect(labellisationPom.validateAuditModalTitle).toBeVisible();
    // Disabled tant qu'il n'y a pas de rapport
    await expect(labellisationPom.validateAuditModalButton).toBeDisabled();

    await labellisationPom.setValidateAuditReportTestDocument();
    await expect(labellisationPom.validateAuditModalButton).toBeEnabled();
    await labellisationPom.validateAuditModalButton.click();

    await labellisationPom.checkLabellisationEnCoursAuditedBy(auditeurUser);
  });
});
