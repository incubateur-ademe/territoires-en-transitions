import { expect, Locator, Page } from '@playwright/test';
import { CollectiviteRole } from '@tet/domain/users';
import {
  failUserCollectivitesRequest,
  testWithPaniers,
  toPanierUrl,
} from './paniers.fixture';

const test = testWithPaniers;

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const toDaysAgo = (days: number): Date =>
  new Date(Date.now() - days * DAY_IN_MS);

const gotoLanding = async (
  page: Page,
  collectiviteId: number
): Promise<void> => {
  await page.goto(toPanierUrl(`/landing/collectivite/${collectiviteId}`));
};

const getStartPanierButton = (page: Page): Locator =>
  page.getByRole('button', { name: "C'est parti !" });

const startPanierFromLanding = async (
  page: Page,
  collectiviteId: number
): Promise<void> => {
  await gotoLanding(page, collectiviteId);
  await getStartPanierButton(page).click();
  await expect(page).toHaveURL(/\/panier\/[^/?]+/);
};

const getCollectiviteHomeLink = (page: Page, nom: string): Locator =>
  page
    .getByRole('banner')
    .getByRole('link', { name: nom, exact: true })
    .filter({ visible: true });

const toCollectiviteHomeHref = (collectiviteId: number): RegExp =>
  new RegExp(`/collectivite/${collectiviteId}/accueil$`);

test.describe(
  "Rattachement de l'utilisateur à la collectivité du panier",
  { tag: '@panier' },
  () => {
    test('invite un visiteur anonyme à se connecter avant de commencer', async ({
      page,
      collectivites,
      paniers,
    }): Promise<void> => {
      const { collectivite } = await collectivites.addCollectiviteAndUser({
        userArgs: { role: CollectiviteRole.ADMIN },
      });
      await paniers.refreshSiteLabellisation();

      await gotoLanding(page, collectivite.data.id);

      await expect(
        page.getByText(
          'Connectez-vous ou créez un compte pour contribuer sur le panier de cette collectivité.'
        )
      ).toBeVisible();
      await expect(getStartPanierButton(page)).toBeDisabled();
    });

    test("laisse un membre en lecture commencer et le renvoie vers l'accueil de sa collectivité", async ({
      page,
      collectivites,
      paniers,
    }): Promise<void> => {
      const { collectivite } = await collectivites.addCollectiviteAndUser({
        userArgs: { role: CollectiviteRole.ADMIN },
      });
      const lecteur = await collectivite.addUser({
        role: CollectiviteRole.LECTURE,
      });
      await paniers.refreshSiteLabellisation();

      await lecteur.login();
      await startPanierFromLanding(page, collectivite.data.id);

      await expect(
        getCollectiviteHomeLink(page, collectivite.data.nom)
      ).toHaveAttribute('href', toCollectiviteHomeHref(collectivite.data.id));
    });

    test("indique à un utilisateur connecté qu'il n'est pas rattaché à la collectivité", async ({
      page,
      collectivites,
      paniers,
    }): Promise<void> => {
      const { collectivite } = await collectivites.addCollectiviteAndUser({
        userArgs: { role: CollectiviteRole.ADMIN },
      });
      const { user: memberOfAnotherCollectivite } =
        await collectivites.addCollectiviteAndUser({
          userArgs: { role: CollectiviteRole.EDITION },
        });
      await paniers.refreshSiteLabellisation();

      await memberOfAnotherCollectivite.login();
      await gotoLanding(page, collectivite.data.id);

      await expect(
        page.getByText("Vous n'êtes pas rattaché à cette collectivité.")
      ).toBeVisible();
      await expect(getStartPanierButton(page)).toBeDisabled();
    });

    test("considère l'auditeur d'un audit non clos comme rattaché à la collectivité auditée", async ({
      page,
      collectivites,
      referentiels,
      paniers,
    }): Promise<void> => {
      const { collectivite: collectiviteAuditee, user: adminAuditee } =
        await collectivites.addCollectiviteAndUser({
          userArgs: { role: CollectiviteRole.ADMIN },
        });
      const { user: auditeur } = await collectivites.addCollectiviteAndUser({
        userArgs: { role: CollectiviteRole.EDITION },
      });
      await adminAuditee.login();
      await referentiels.addAuditeur({
        user: adminAuditee,
        auditeurUserId: auditeur.data.id,
        collectiviteId: collectiviteAuditee.data.id,
        referentielId: 'cae',
      });
      await paniers.refreshSiteLabellisation();

      await auditeur.login();
      await startPanierFromLanding(page, collectiviteAuditee.data.id);

      await expect(
        getCollectiviteHomeLink(page, collectiviteAuditee.data.nom)
      ).toHaveAttribute(
        'href',
        toCollectiviteHomeHref(collectiviteAuditee.data.id)
      );
    });

    test("considère encore l'auditeur comme rattaché 14 jours après la clôture de l'audit", async ({
      page,
      collectivites,
      referentiels,
      paniers,
    }): Promise<void> => {
      const { collectivite: collectiviteAuditee, user: adminAuditee } =
        await collectivites.addCollectiviteAndUser({
          userArgs: { role: CollectiviteRole.ADMIN },
        });
      const { user: auditeur } = await collectivites.addCollectiviteAndUser({
        userArgs: { role: CollectiviteRole.EDITION },
      });
      await adminAuditee.login();
      await referentiels.addAuditeur({
        user: adminAuditee,
        auditeurUserId: auditeur.data.id,
        collectiviteId: collectiviteAuditee.data.id,
        referentielId: 'cae',
      });
      await referentiels.closeAudit({
        collectiviteId: collectiviteAuditee.data.id,
        referentielId: 'cae',
        dateFin: toDaysAgo(14),
      });
      await paniers.refreshSiteLabellisation();

      await auditeur.login();
      await startPanierFromLanding(page, collectiviteAuditee.data.id);

      await expect(
        getCollectiviteHomeLink(page, collectiviteAuditee.data.nom)
      ).toHaveAttribute(
        'href',
        toCollectiviteHomeHref(collectiviteAuditee.data.id)
      );
    });

    test("ne considère plus l'auditeur comme rattaché 16 jours après la clôture de l'audit", async ({
      page,
      collectivites,
      referentiels,
      paniers,
    }): Promise<void> => {
      const { collectivite: collectiviteAuditee, user: adminAuditee } =
        await collectivites.addCollectiviteAndUser({
          userArgs: { role: CollectiviteRole.ADMIN },
        });
      const { user: auditeur } = await collectivites.addCollectiviteAndUser({
        userArgs: { role: CollectiviteRole.EDITION },
      });
      await adminAuditee.login();
      await referentiels.addAuditeur({
        user: adminAuditee,
        auditeurUserId: auditeur.data.id,
        collectiviteId: collectiviteAuditee.data.id,
        referentielId: 'cae',
      });
      await referentiels.closeAudit({
        collectiviteId: collectiviteAuditee.data.id,
        referentielId: 'cae',
        dateFin: toDaysAgo(16),
      });
      await paniers.refreshSiteLabellisation();

      await auditeur.login();
      await gotoLanding(page, collectiviteAuditee.data.id);

      await expect(
        page.getByText("Vous n'êtes pas rattaché à cette collectivité.")
      ).toBeVisible();
      await expect(getStartPanierButton(page)).toBeDisabled();
    });

    test("indique au membre d'une collectivité active que ses collectivités n'ont pas pu être chargées", async ({
      page,
      collectivites,
      paniers,
    }): Promise<void> => {
      const { collectivite, user } = await collectivites.addCollectiviteAndUser(
        { userArgs: { role: CollectiviteRole.ADMIN } }
      );
      await paniers.refreshSiteLabellisation();

      await user.login();
      await failUserCollectivitesRequest(page);
      await gotoLanding(page, collectivite.data.id);

      await expect(
        page
          .getByRole('alert')
          .filter({ hasText: "Vos collectivités n'ont pas pu être chargées" })
      ).toBeVisible();
      await expect(getStartPanierButton(page)).toBeDisabled();
    });
  }
);
