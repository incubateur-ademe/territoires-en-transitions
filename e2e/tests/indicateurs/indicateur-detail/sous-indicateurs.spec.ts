import { expect } from '@playwright/test';
import { test } from 'tests/main.fixture';
import type { UserFixture } from 'tests/users/users.fixture';

const PARENT_TITRE = 'Déchets collectés';

test.describe("Sous-indicateurs d'un indicateur personnalisé", () => {
  let owner: UserFixture;
  let collectiviteId: number;
  let parentId: number;
  let enfantIds: number[];

  test.beforeEach(async ({ page, collectivites, indicateurs }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    owner = user;
    collectiviteId = collectivite.data.id;
    parentId = await indicateurs.create(user, {
      collectiviteId,
      titre: PARENT_TITRE,
      unite: 'kg',
    });
    enfantIds = [];
    for (const titre of ['Ménagers', 'Verre']) {
      enfantIds.push(
        await indicateurs.create(user, { collectiviteId, titre, parentId })
      );
    }
    await page.goto('/');
  });

  test("L'unité d'un sous-indicateur est désactivée et s'appuie sur celle de son parent", async ({
    page,
    indicateurDetailPom,
  }) => {
    await indicateurDetailPom.goto(collectiviteId, enfantIds[0]);

    const unite = page.getByRole('textbox', { name: /^Unité/ });
    await expect(unite).toBeDisabled();
    await expect(
      page.getByText(
        `Ce sous-indicateur s'appuie sur l'unité de son indicateur parent, ${PARENT_TITRE}`
      )
    ).toBeVisible();
  });

  test("L'unité du parent reste modifiable, sans explication", async ({
    page,
    indicateurDetailPom,
  }) => {
    await indicateurDetailPom.goto(collectiviteId, parentId);

    await expect(page.getByRole('textbox', { name: /^Unité/ })).toBeEnabled();
    await expect(page.getByText(/s'appuie sur l'unité/)).toHaveCount(0);
  });

  test('La suppression du parent annonce que ses sous-indicateurs deviennent indépendants et les conserve', async ({
    page,
    indicateurDetailPom,
  }) => {
    await indicateurDetailPom.goto(collectiviteId, parentId);

    await page.locator('[data-test="indicateurs.detail.menu"]').click();
    await page.getByRole('button', { name: "Supprimer l'indicateur" }).click();

    await expect(
      page.getByText('Vous êtes sur le point de supprimer cet indicateur.')
    ).toBeVisible();
    await expect(
      page.getByText(
        'Ses 2 sous-indicateurs ne seront pas supprimés : ils deviennent des indicateurs indépendants, avec leurs données.'
      )
    ).toBeVisible();

    await page.getByRole('button', { name: 'Supprimer', exact: true }).click();

    await indicateurDetailPom.goto(collectiviteId, enfantIds[0]);
    await expect(page.getByRole('textbox', { name: /^Unité/ })).toBeEnabled();
    await expect(page.getByText(/s'appuie sur l'unité/)).toHaveCount(0);
  });

  test("La suppression d'un indicateur sans sous-indicateur garde la description habituelle", async ({
    page,
    indicateurDetailPom,
  }) => {
    await indicateurDetailPom.goto(collectiviteId, enfantIds[0]);

    await page.locator('[data-test="indicateurs.detail.menu"]').click();
    await page.getByRole('button', { name: "Supprimer l'indicateur" }).click();

    await expect(
      page.getByText(/Êtes-vous sûr de vouloir supprimer cet indicateur/)
    ).toBeVisible();
    await expect(
      page.getByText('Vous êtes sur le point de supprimer cet indicateur.')
    ).toHaveCount(0);
  });

  test('Créer un sous-indicateur ouvre son nom, le renommer puis le dissocier', async ({
    page,
    indicateurDetailPom,
  }) => {
    await indicateurDetailPom.goto(collectiviteId, parentId);

    await page
      .getByRole('button', { name: 'Créer un sous-indicateur' })
      .first()
      .click();

    const nom = page.getByRole('textbox', { name: 'Nom du sous-indicateur' });
    await expect(nom).toBeFocused();
    await expect(nom).toHaveValue('Sous-indicateur 3');
    await nom.fill('Papier');
    await nom.press('Enter');

    await expect(
      page.getByRole('button', { name: 'Renommer Papier' })
    ).toBeVisible();

    await page.getByRole('button', { name: 'Dissocier Papier' }).click();
    await page.getByRole('button', { name: 'Confirmer' }).click();

    await expect(
      page.getByRole('button', { name: 'Renommer Papier' })
    ).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'Renommer Ménagers' })
    ).toBeVisible();
  });

  test('Supprimer une période efface les valeurs de tous les sous-indicateurs en un seul appel', async ({
    page,
    indicateurDetailPom,
  }) => {
    for (const indicateurId of enfantIds) {
      for (const dateValeur of ['2022-01-01', '2023-01-01']) {
        await owner.getTrpcClient().indicateurs.valeurs.upsert.mutate({
          collectiviteId,
          indicateurId,
          periodicite: 'annuelle',
          dateValeur,
          resultat: 5,
        });
      }
    }
    const requestUrls: string[] = [];
    page.on('request', (request) => requestUrls.push(request.url()));
    await indicateurDetailPom.goto(collectiviteId, parentId);

    await page
      .getByRole('button', { name: 'Supprimer la période 2022', exact: true })
      .click();
    await page.getByRole('button', { name: 'Confirmer' }).click();

    await expect(page.getByRole('columnheader', { name: /2022/ })).toHaveCount(
      0
    );
    await expect(
      page.getByRole('columnheader', { name: /2023/ })
    ).toBeVisible();
    await page.reload();
    await expect(page.getByRole('columnheader', { name: /2022/ })).toHaveCount(
      0
    );
    expect(
      requestUrls.filter((url) =>
        url.includes('indicateurs.valeurs.deletePeriode')
      )
    ).toHaveLength(1);
    expect(
      requestUrls.filter((url) =>
        /indicateurs\.valeurs\.delete(?![A-Za-z])/.test(url)
      )
    ).toHaveLength(0);
  });
});
