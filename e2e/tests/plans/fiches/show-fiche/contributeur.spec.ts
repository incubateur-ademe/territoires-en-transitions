import { expect } from '@playwright/test';
import { testWithFiches } from 'tests/plans/fiches/fiches.fixture';

const test = testWithFiches;

test.describe('Contributeur — restrictions sur la fiche action', () => {
  test("l'onglet « Mesures liées » est caché pour un contributeur", async ({
    page,
    collectivites,
    fiches,
  }) => {
    const { collectivite, user: adminUser } =
      await collectivites.addCollectiviteAndUser({
        userArgs: { role: 'admin', autoLogin: true },
      });

    const [ficheId] = await fiches.create(adminUser, [
      {
        titre: 'Fiche test contributeur mesures',
        collectiviteId: collectivite.data.id,
        statut: 'En cours',
      },
    ]);

    const contributeur = await collectivite.addUser({
      role: 'edition_fiches_indicateurs',
    });
    await contributeur.login();

    await page.goto(
      `/collectivite/${collectivite.data.id}/actions/${ficheId}/details`
    );

    await expect(
      page.getByRole('tab', { name: /Présentation/ })
    ).toBeVisible();

    await expect(
      page.getByRole('tab', { name: /Mesures liées/ })
    ).toHaveCount(0);
  });

  test('description et objectifs sont en lecture seule pour un contributeur non pilote', async ({
    page,
    collectivites,
    fiches,
  }) => {
    const { collectivite, user: adminUser } =
      await collectivites.addCollectiviteAndUser({
        userArgs: { role: 'admin', autoLogin: true },
      });

    const [ficheId] = await fiches.create(adminUser, [
      {
        titre: 'Fiche test contributeur non pilote',
        collectiviteId: collectivite.data.id,
        statut: 'En cours',
      },
    ]);

    await adminUser.getTrpcClient().plans.fiches.update.mutate({
      ficheId,
      ficheFields: {
        description: '<p>Description de test</p>',
        objectifs: '<p>Objectifs de test</p>',
      },
    });

    const contributeur = await collectivite.addUser({
      role: 'edition_fiches_indicateurs',
    });
    await contributeur.login();

    await page.goto(
      `/collectivite/${collectivite.data.id}/actions/${ficheId}/details`
    );

    await expect(page.getByText('Description de test')).toBeVisible();
    await expect(page.getByText('Objectifs de test')).toBeVisible();

    await expect(
      page.getByRole('textbox', { name: 'Description' })
    ).toHaveAttribute('aria-readonly', 'true');
    await expect(
      page.getByRole('textbox', { name: 'Objectifs' })
    ).toHaveAttribute('aria-readonly', 'true');
  });

  test('description et objectifs sont éditables pour un contributeur pilote', async ({
    page,
    collectivites,
    fiches,
  }) => {
    const { collectivite, user: adminUser } =
      await collectivites.addCollectiviteAndUser({
        userArgs: { role: 'admin', autoLogin: true },
      });

    const [ficheId] = await fiches.create(adminUser, [
      {
        titre: 'Fiche test contributeur pilote',
        collectiviteId: collectivite.data.id,
        statut: 'En cours',
      },
    ]);

    await adminUser.getTrpcClient().plans.fiches.update.mutate({
      ficheId,
      ficheFields: {
        description: '<p>Description de test</p>',
        objectifs: '<p>Objectifs de test</p>',
      },
    });

    const contributeur = await collectivite.addUser({
      role: 'edition_fiches_indicateurs',
    });

    // Assigne le contributeur comme pilote de la fiche
    await fiches.bulkEdit(adminUser, {
      collectiviteId: collectivite.data.id,
      ficheIds: [ficheId],
      pilotes: {
        add: [{ userId: contributeur.data.id }],
      },
    });

    await contributeur.login();
    await page.goto(
      `/collectivite/${collectivite.data.id}/actions/${ficheId}/details`
    );

    await expect(page.getByText('Description de test')).toBeVisible();
    await expect(page.getByText('Objectifs de test')).toBeVisible();

    await expect(
      page.getByRole('textbox', { name: 'Description' })
    ).toHaveAttribute('aria-readonly', 'false');
    await expect(
      page.getByRole('textbox', { name: 'Objectifs' })
    ).toHaveAttribute('aria-readonly', 'false');
  });

  test('le toggle « Détailler par année » est caché pour un contributeur non pilote', async ({
    page,
    collectivites,
    fiches,
  }) => {
    const { collectivite, user: adminUser } =
      await collectivites.addCollectiviteAndUser({
        userArgs: { role: 'admin', autoLogin: true },
      });

    const [ficheId] = await fiches.create(adminUser, [
      {
        titre: 'Fiche test contributeur budget',
        collectiviteId: collectivite.data.id,
        statut: 'En cours',
      },
    ]);

    const contributeur = await collectivite.addUser({
      role: 'edition_fiches_indicateurs',
    });
    await contributeur.login();

    await page.goto(
      `/collectivite/${collectivite.data.id}/actions/${ficheId}/budget`
    );

    await expect(
      page.getByRole('heading', { name: "Budget d'investissement :" })
    ).toBeVisible();

    await expect(
      page.getByRole('checkbox', { name: 'Détailler par année' })
    ).toHaveCount(0);
  });

  test('le toggle « Détailler par année » est visible pour un contributeur pilote', async ({
    page,
    collectivites,
    fiches,
  }) => {
    const { collectivite, user: adminUser } =
      await collectivites.addCollectiviteAndUser({
        userArgs: { role: 'admin', autoLogin: true },
      });

    const [ficheId] = await fiches.create(adminUser, [
      {
        titre: 'Fiche test contributeur pilote budget',
        collectiviteId: collectivite.data.id,
        statut: 'En cours',
      },
    ]);

    const contributeur = await collectivite.addUser({
      role: 'edition_fiches_indicateurs',
    });

    await fiches.bulkEdit(adminUser, {
      collectiviteId: collectivite.data.id,
      ficheIds: [ficheId],
      pilotes: {
        add: [{ userId: contributeur.data.id }],
      },
    });

    await contributeur.login();
    await page.goto(
      `/collectivite/${collectivite.data.id}/actions/${ficheId}/budget`
    );

    await expect(
      page.getByRole('heading', { name: "Budget d'investissement :" })
    ).toBeVisible();

    await expect(
      page.getByRole('checkbox', { name: 'Détailler par année' }).first()
    ).toBeVisible();
  });
});
