import { expect, type Page } from '@playwright/test';
import { ReferentielId } from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';
import { testWithReferentiels as test } from '../referentiels.fixture';

const referentiel: ReferentielId = 'eci';

const replaceButton = (page: Page) =>
  page.getByRole('button', {
    name: 'Remplacer le fichier',
    includeHidden: true,
  });

const deleteButton = (page: Page) =>
  page.getByRole('button', {
    name: 'Supprimer',
    includeHidden: true,
  });

test.describe(
  "Bouton « Remplacer le fichier » du rapport d'audit dans la bibliothèque",
  () => {
    test.beforeEach(
      async ({ collectivites, referentiels, labellisationPom }) => {
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
          role: CollectiviteRole.LECTURE,
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

        // L'auditeur clôture l'audit en déposant un rapport
        await labellisationPom.goto(referentiel);
        await labellisationPom.cloturerAuditButton.click();
        await labellisationPom.uploadCloturerAuditReport();
        await labellisationPom.cloturerAuditSuivantButton.click();
        await labellisationPom.cloturerAuditEngagementCheckbox.check();
        await labellisationPom.cloturerAuditValiderButton.click();
        await labellisationPom.checkLabellisationEnCoursAuditedBy(auditeurUser);
      }
    );

    test("l'auditeur voit le bouton après clôture (fenêtre 15 j)", async ({
      page,
      collectivites,
    }) => {
      const collectiviteId = collectivites.getCollectivite().data.id;
      await page.goto(`/collectivite/${collectiviteId}/bibliotheque`);
      await expect(page.getByText('document_test.pdf').first()).toBeVisible();
      await expect(replaceButton(page)).toHaveCount(1);
    });

    test("l'auditeur ne peut pas supprimer le rapport d'audit", async ({
      page,
      collectivites,
    }) => {
      const collectiviteId = collectivites.getCollectivite().data.id;
      await page.goto(`/collectivite/${collectiviteId}/bibliotheque`);
      await expect(page.getByText('document_test.pdf').first()).toBeVisible();
      await expect(replaceButton(page)).toHaveCount(1);
      await expect(deleteButton(page)).toHaveCount(0);
    });

    test("un éditeur de la collectivité ne voit pas le bouton", async ({
      page,
      collectivites,
    }) => {
      const collectivite = collectivites.getCollectivite();
      await collectivite.getUser(0).login();
      await page.goto(`/collectivite/${collectivite.data.id}/bibliotheque`);
      await expect(page.getByText('document_test.pdf').first()).toBeVisible();
      await expect(replaceButton(page)).toHaveCount(0);
    });

    test("un visiteur (lecture seule) ne voit pas le bouton", async ({
      page,
      collectivites,
    }) => {
      const collectivite = collectivites.getCollectivite();
      const visiteurUser = await collectivite.addUser({
        role: CollectiviteRole.LECTURE,
        autoLogin: true,
      });
      await visiteurUser.login();
      await page.goto(`/collectivite/${collectivite.data.id}/bibliotheque`);
      await expect(page.getByText('document_test.pdf').first()).toBeVisible();
      await expect(replaceButton(page)).toHaveCount(0);
    });

    test("un membre admin de la collectivité ne voit pas le bouton", async ({
      page,
      collectivites,
    }) => {
      const collectivite = collectivites.getCollectivite();
      const adminUser = await collectivite.addUser({
        role: CollectiviteRole.ADMIN,
        autoLogin: true,
      });
      await adminUser.login();
      await page.goto(`/collectivite/${collectivite.data.id}/bibliotheque`);
      await expect(page.getByText('document_test.pdf').first()).toBeVisible();
      await expect(replaceButton(page)).toHaveCount(0);
    });
  }
);
