import { expect } from '@playwright/test';
import { testWithFiches } from 'tests/plans/fiches/fiches.fixture';
import { SousActionsPom } from './sous-actions.pom';

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

  test('un contributeur pilote peut ajouter une sous-action à une fiche dont il est pilote', async ({
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
        titre: 'Fiche parente pilotée par le contributeur',
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

    const sousActionsPom = new SousActionsPom(page);
    await sousActionsPom.goto(collectivite.data.id, ficheId);

    // État initial : aucune sous-action, bouton d'ajout visible dans la carte vide
    await expect(sousActionsPom.emptyStateHeading).toBeVisible();
    await expect(sousActionsPom.addSousActionButton).toBeVisible();

    await sousActionsPom.clickAddSousAction();

    // Après création, une sous-action « Sans titre » apparaît et la carte vide disparaît
    await expect(sousActionsPom.emptyStateHeading).toBeHidden();
    await expect(
      page.getByRole('row').filter({ hasText: 'Sans titre' })
    ).toHaveCount(1);
  });

  test("un contributeur non pilote ne voit pas le bouton d'ajout de sous-action", async ({
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
        titre: 'Fiche non pilotée par le contributeur',
        collectiviteId: collectivite.data.id,
        statut: 'En cours',
      },
    ]);

    const contributeur = await collectivite.addUser({
      role: 'edition_fiches_indicateurs',
    });
    await contributeur.login();

    const sousActionsPom = new SousActionsPom(page);
    await sousActionsPom.goto(collectivite.data.id, ficheId);

    await expect(sousActionsPom.emptyStateHeading).toBeVisible();
    await expect(sousActionsPom.addSousActionButton).toHaveCount(0);
  });

  test('un contributeur pilote peut modifier le titre d’une sous-action', async ({
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
        titre: 'Fiche parente avec sous-action',
        collectiviteId: collectivite.data.id,
        statut: 'En cours',
      },
    ]);

    const titreInitial = 'Sous-action à modifier';
    await fiches.create(adminUser, [
      {
        titre: titreInitial,
        collectiviteId: collectivite.data.id,
        parentId: ficheId,
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

    const sousActionsPom = new SousActionsPom(page);
    await sousActionsPom.goto(collectivite.data.id, ficheId);

    await expect(
      page.getByRole('row').filter({ hasText: titreInitial })
    ).toHaveCount(1);

    const nouveauTitre = 'Sous-action modifiée par le pilote parent';
    await sousActionsPom.editTitle(titreInitial, nouveauTitre);

    await expect(
      page.getByRole('row').filter({ hasText: nouveauTitre })
    ).toHaveCount(1);
    await expect(
      page.getByRole('row').filter({ hasText: titreInitial })
    ).toHaveCount(0);
  });

  test('un contributeur pilote peut supprimer une sous-action', async ({
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
        titre: 'Fiche parente avec sous-action à supprimer',
        collectiviteId: collectivite.data.id,
        statut: 'En cours',
      },
    ]);

    const titreSousAction = 'Sous-action à supprimer';
    await fiches.create(adminUser, [
      {
        titre: titreSousAction,
        collectiviteId: collectivite.data.id,
        parentId: ficheId,
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

    const sousActionsPom = new SousActionsPom(page);
    await sousActionsPom.goto(collectivite.data.id, ficheId);

    await expect(
      page.getByRole('row').filter({ hasText: titreSousAction })
    ).toHaveCount(1);

    await sousActionsPom.deleteSousAction(titreSousAction);

    await expect(
      page.getByRole('row').filter({ hasText: titreSousAction })
    ).toHaveCount(0);
    await expect(sousActionsPom.emptyStateHeading).toBeVisible();
  });

  test("un contributeur non pilote ne voit pas le bouton de suppression d'une sous-action", async ({
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
        titre: 'Fiche non pilotée par le contributeur (delete)',
        collectiviteId: collectivite.data.id,
        statut: 'En cours',
      },
    ]);

    const titreSousAction = 'Sous-action non supprimable par contributeur';
    await fiches.create(adminUser, [
      {
        titre: titreSousAction,
        collectiviteId: collectivite.data.id,
        parentId: ficheId,
      },
    ]);

    const contributeur = await collectivite.addUser({
      role: 'edition_fiches_indicateurs',
    });
    await contributeur.login();

    const sousActionsPom = new SousActionsPom(page);
    await sousActionsPom.goto(collectivite.data.id, ficheId);

    await expect(
      page.getByRole('row').filter({ hasText: titreSousAction })
    ).toHaveCount(1);
    await expect(sousActionsPom.deleteButton(titreSousAction)).toHaveCount(0);
  });
});
