import { expect } from '@playwright/test';
import { ReferentielId } from '@tet/domain/referentiels';
import { testWithReferentiels as test } from '../referentiels.fixture';
import { StartAuditPom } from './start-audit.pom';

const referentiel: ReferentielId = 'cae';

test.describe('Modale "Démarrer un audit"', () => {
  test("Collectivité COT : l'envoi d'une demande d'audit COT ferme la modale", async ({
    page,
    collectivites,
    users,
    referentiels,
  }) => {
    await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
      collectiviteArgs: { isCOT: true },
    });
    const user = await users.getUser();
    const collectivite = collectivites.getCollectivite();
    await referentiels.updateAllReferentielStatutsToFait(
      user,
      collectivite.data.id,
      referentiel
    );

    const startAuditPom = new StartAuditPom(page);
    await startAuditPom.goto(collectivite.data.id, referentiel);
    await startAuditPom.openModal();

    await startAuditPom.auditTypeGroup
      .getByRole('radio', { name: 'Audit COT sans labellisation' })
      .click();
    await startAuditPom.submitButton.click();

    await expect(startAuditPom.successToast).toBeVisible();
    await expect(startAuditPom.modal).toHaveCount(0);
  });
});
