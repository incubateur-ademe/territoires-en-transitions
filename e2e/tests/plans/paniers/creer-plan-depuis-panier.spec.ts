import { expect, Page } from '@playwright/test';
import { CollectiviteRole } from '@tet/domain/users';
import {
  failUserCollectivitesRequest,
  testWithPaniers,
  toPanierUrl,
  toUniqueNom,
} from './paniers.fixture';

const test = testWithPaniers;

const openCollectiviteSelect = async (page: Page): Promise<void> => {
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'ouvrir le menu' })
    .click();
};

const listVisibleOptions = async (
  page: Page,
  noms: string[]
): Promise<string[]> => {
  const visibilities = await Promise.all(
    noms.map((nom) =>
      page.getByRole('button', { name: nom, exact: true }).isVisible()
    )
  );
  return noms.filter((_, index) => visibilities[index]).sort();
};

test.describe('Création de plan depuis un panier', { tag: '@panier' }, () => {
  test("propose les collectivités où l'utilisateur est admin ou en édition, pas celles en lecture", async ({
    page,
    collectivites,
    users,
    paniers,
  }): Promise<void> => {
    const collectiviteAdmin = await collectivites.addCollectivite({
      nom: toUniqueNom('Collectivité admin'),
    });
    const collectiviteEdition = await collectivites.addCollectivite({
      nom: toUniqueNom('Collectivité édition'),
    });
    const collectiviteLecture = await collectivites.addCollectivite({
      nom: toUniqueNom('Collectivité lecture'),
    });
    const user = await collectiviteLecture.addUser({
      role: CollectiviteRole.LECTURE,
    });
    await users.setUserCollectiviteRole({
      userId: user.data.id,
      collectiviteId: collectiviteAdmin.data.id,
      role: CollectiviteRole.ADMIN,
    });
    await users.setUserCollectiviteRole({
      userId: user.data.id,
      collectiviteId: collectiviteEdition.data.id,
      role: CollectiviteRole.EDITION,
    });
    const panierId = await paniers.createWithAction(collectiviteAdmin.data.id);

    await user.login();
    await page.goto(toPanierUrl(`/panier/${panierId}?modale=creation`));
    await openCollectiviteSelect(page);

    const noms = [
      collectiviteAdmin.data.nom,
      collectiviteEdition.data.nom,
      collectiviteLecture.data.nom,
    ];
    await expect
      .poll(() => listVisibleOptions(page, noms))
      .toEqual(
        [collectiviteAdmin.data.nom, collectiviteEdition.data.nom].sort()
      );
  });

  test("ne propose pas une collectivité où l'utilisateur est seulement auditeur", async ({
    page,
    collectivites,
    referentiels,
    paniers,
  }): Promise<void> => {
    const { collectivite: collectiviteAuditee, user: adminAuditee } =
      await collectivites.addCollectiviteAndUser({
        collectiviteArgs: { nom: toUniqueNom('Collectivité auditée') },
        userArgs: { role: CollectiviteRole.ADMIN },
      });
    const { collectivite: collectiviteEdition, user: auditeur } =
      await collectivites.addCollectiviteAndUser({
        collectiviteArgs: { nom: toUniqueNom('Collectivité édition') },
        userArgs: { role: CollectiviteRole.EDITION },
      });
    await adminAuditee.login();
    await referentiels.addAuditeur({
      user: adminAuditee,
      auditeurUserId: auditeur.data.id,
      collectiviteId: collectiviteAuditee.data.id,
      referentielId: 'cae',
    });
    const panierId = await paniers.createWithAction(
      collectiviteEdition.data.id
    );

    await auditeur.login();
    await page.goto(toPanierUrl(`/panier/${panierId}?modale=creation`));
    await openCollectiviteSelect(page);

    await expect
      .poll(() =>
        listVisibleOptions(page, [
          collectiviteAuditee.data.nom,
          collectiviteEdition.data.nom,
        ])
      )
      .toEqual([collectiviteEdition.data.nom]);
  });

  test("propose de rejoindre une collectivité à l'utilisateur qui n'est qu'en lecture", async ({
    page,
    collectivites,
    paniers,
  }): Promise<void> => {
    const { collectivite, user: lecteur } =
      await collectivites.addCollectiviteAndUser({
        userArgs: { role: CollectiviteRole.LECTURE },
      });
    const panierId = await paniers.createWithAction(collectivite.data.id);

    await lecteur.login();
    await page.goto(toPanierUrl(`/panier/${panierId}?modale=creation`));

    await expect(
      page
        .getByRole('dialog')
        .getByRole('link', { name: 'Rejoindre une collectivité' })
    ).toBeVisible();
  });

  test("indique à l'utilisateur que ses collectivités n'ont pas pu être chargées", async ({
    page,
    collectivites,
    paniers,
  }): Promise<void> => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { role: CollectiviteRole.EDITION },
    });
    const panierId = await paniers.createWithAction(collectivite.data.id);

    await user.login();
    await failUserCollectivitesRequest(page);
    await page.goto(toPanierUrl(`/panier/${panierId}?modale=creation`));

    await expect(page.getByRole('dialog').getByRole('alert')).toContainText(
      "Vos collectivités n'ont pas pu être chargées"
    );
  });
});
