import { expect } from '@playwright/test';
import { ReferentielId } from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';
import { CollectiviteFixture } from 'tests/collectivite/collectivites.fixture';
import { UserFixture } from 'tests/users/users.fixture';
import { testWithReferentiels } from '../referentiels.fixture';

const referentiel: ReferentielId = 'eci';

type ClosedAuditReport = {
  collectivite: CollectiviteFixture;
  collectiviteId: number;
  auditeurUser: UserFixture;
};

const test = testWithReferentiels.extend<{
  closedAuditReport: ClosedAuditReport;
}>({
  closedAuditReport: async (
    { collectivites, referentiels, labellisationPom },
    use
  ) => {
    const { collectivite, user: porteur } =
      await collectivites.addCollectiviteAndUser({
        userArgs: { autoLogin: true },
        collectiviteArgs: { isCOT: true },
      });
    const collectiviteId = collectivite.data.id;
    await referentiels.requestLabellisationForCot(
      porteur,
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

    await labellisationPom.goto(referentiel);
    await labellisationPom.cloturerAuditButton.click();
    await labellisationPom.uploadCloturerAuditReport();
    await labellisationPom.cloturerAuditSuivantButton.click();
    await labellisationPom.cloturerAuditEngagementCheckbox.check();
    await labellisationPom.cloturerAuditValiderButton.click();
    await labellisationPom.checkLabellisationEnCoursAuditedBy(auditeurUser);

    await use({ collectivite, collectiviteId, auditeurUser });
  },
});

test.describe(
  "Rapport d'audit dans la bibliothèque",
  () => {
    test(
      "l'auditeur voit le bouton « Remplacer le fichier » pendant la fenêtre de 15 jours",
      async ({ page, closedAuditReport }) => {
        const { collectiviteId, auditeurUser } = closedAuditReport;

        await auditeurUser.login();
        await page.goto(`/collectivite/${collectiviteId}/bibliotheque`);
        await expect(page.getByText('document_test.pdf').first()).toBeVisible();
        await expect(page.getByTitle('Remplacer le fichier')).toHaveCount(1);
      }
    );

    test(
      "l'auditeur ne voit plus le bouton « Remplacer le fichier » une fois la fenêtre de 15 jours dépassée",
      async ({ page, referentiels, closedAuditReport }) => {
        const { collectiviteId, auditeurUser } = closedAuditReport;

        await referentiels.expireAuditReportEditWindow({
          collectiviteId,
          referentielId: referentiel,
        });

        await auditeurUser.login();
        await page.goto(`/collectivite/${collectiviteId}/bibliotheque`);
        await expect(page.getByText('document_test.pdf').first()).toBeVisible();
        await expect(page.getByTitle('Remplacer le fichier')).toHaveCount(0);
      }
    );

    test(
      'un membre admin de la collectivité ne voit pas le bouton « Remplacer le fichier »',
      async ({ page, closedAuditReport }) => {
        const { collectivite, collectiviteId } = closedAuditReport;

        const adminUser = await collectivite.addUser({
          role: CollectiviteRole.ADMIN,
          autoLogin: true,
        });
        await adminUser.login();
        await page.goto(`/collectivite/${collectiviteId}/bibliotheque`);
        await expect(page.getByText('document_test.pdf').first()).toBeVisible();
        await expect(page.getByTitle('Remplacer le fichier')).toHaveCount(0);
      }
    );

    test(
      'un visiteur en lecture seule ne voit pas le bouton « Remplacer le fichier »',
      async ({ page, closedAuditReport }) => {
        const { collectivite, collectiviteId } = closedAuditReport;

        const visiteurUser = await collectivite.addUser({
          role: CollectiviteRole.LECTURE,
          autoLogin: true,
        });
        await visiteurUser.login();
        await page.goto(`/collectivite/${collectiviteId}/bibliotheque`);
        await expect(page.getByText('document_test.pdf').first()).toBeVisible();
        await expect(page.getByTitle('Remplacer le fichier')).toHaveCount(0);
      }
    );
  }
);
