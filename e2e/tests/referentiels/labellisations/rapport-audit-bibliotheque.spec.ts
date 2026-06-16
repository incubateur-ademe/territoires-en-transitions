import { expect } from '@playwright/test';
import { ReferentielId } from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';
import { testWithReferentiels as test } from '../referentiels.fixture';

const referentiel: ReferentielId = 'eci';

test.describe("Rapport d'audit dans la bibliothèque", () => {
  test("l'auditeur voit le bouton « Remplacer le fichier » du rapport après clôture, pas la collectivité", async ({
    page,
    collectivites,
    referentiels,
    labellisationPom,
  }) => {
    const { collectivite, user: editeurUser } =
      await collectivites.addCollectiviteAndUser({
        userArgs: { autoLogin: true },
        collectiviteArgs: { isCOT: true },
      });
    const collectiviteId = collectivite.data.id;
    await referentiels.requestLabellisationForCot(
      editeurUser,
      collectiviteId,
      referentiel
    );

    const auditeurUser = await collectivite.addUser({
      role: CollectiviteRole.LECTURE,
      autoLogin: true,
    });
    await referentiels.addAuditeur({
      user: auditeurUser,
      collectiviteId,
      referentielId: referentiel,
    });
    await referentiels.startAudit(auditeurUser, collectiviteId, referentiel);

    // L'auditeur clôture l'audit en déposant un rapport
    await labellisationPom.goto(referentiel);
    await labellisationPom.cloturerAuditButton.click();
    await labellisationPom.uploadCloturerAuditReport();
    await labellisationPom.cloturerAuditSuivantButton.click();
    await labellisationPom.cloturerAuditEngagementCheckbox.check();
    await labellisationPom.cloturerAuditValiderButton.click();
    await labellisationPom.checkLabellisationEnCoursAuditedBy(auditeurUser);

    const replaceButton = page.getByRole('button', {
      name: 'Remplacer le fichier',
      includeHidden: true,
    });

    // L'auditeur conserve son rôle pendant la fenêtre de 15 j : il voit le
    // bouton de remplacement du rapport dans la bibliothèque.
    await page.goto(`/collectivite/${collectiviteId}/bibliotheque`);
    await expect(page.getByText('document_test.pdf').first()).toBeVisible();
    await expect(replaceButton).toHaveCount(1);

    // Un éditeur de la collectivité ne peut pas remplacer le rapport d'audit.
    await editeurUser.login();
    await page.goto(`/collectivite/${collectiviteId}/bibliotheque`);
    await expect(page.getByText('document_test.pdf').first()).toBeVisible();
    await expect(replaceButton).toHaveCount(0);

    // Un visiteur (lecture seule) ne peut pas remplacer le rapport d'audit.
    const visiteurUser = await collectivite.addUser({
      role: CollectiviteRole.LECTURE,
      autoLogin: true,
    });
    await visiteurUser.login();
    await page.goto(`/collectivite/${collectiviteId}/bibliotheque`);
    await expect(page.getByText('document_test.pdf').first()).toBeVisible();
    await expect(replaceButton).toHaveCount(0);

    // Un membre admin de la collectivité ne peut pas remplacer le rapport d'audit.
    const adminUser = await collectivite.addUser({
      role: CollectiviteRole.ADMIN,
      autoLogin: true,
    });
    await adminUser.login();
    await page.goto(`/collectivite/${collectiviteId}/bibliotheque`);
    await expect(page.getByText('document_test.pdf').first()).toBeVisible();
    await expect(replaceButton).toHaveCount(0);
  });
});
