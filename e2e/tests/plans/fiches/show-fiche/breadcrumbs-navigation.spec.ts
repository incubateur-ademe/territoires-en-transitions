import { expect } from '@playwright/test';
import { test } from 'tests/main.fixture';

test.describe("Navigation depuis le fil d'arianne de la fiche", () => {
  test('navigue vers le plan depuis la fiche', async ({
    page,
    collectivites,
    plans,
    fiches,
    editPlanPom,
  }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { role: 'admin', autoLogin: true },
    });

    const planNom = 'Plan navigation';
    const axeNom = 'Axe navigation';
    const ficheTitre = 'Fiche navigation';

    const planId = await plans.create(user, {
      nom: planNom,
      collectiviteId: collectivite.data.id,
    });

    const axeId = await plans.createAxe(user, {
      nom: axeNom,
      collectiviteId: collectivite.data.id,
      planId,
      parent: planId,
    });

    const [ficheId] = await fiches.create(user, [
      {
        titre: ficheTitre,
        collectiviteId: collectivite.data.id,
        axeId,
      },
    ]);

    await page.goto(
      `/collectivite/${collectivite.data.id}/actions/${ficheId}/details?planId=${planId}`
    );

    const planBreadcrumb = page.getByRole('button', { name: planNom });
    await expect(planBreadcrumb).toBeVisible();
    await planBreadcrumb.click();

    await expect(page).toHaveURL(
      new RegExp(`/collectivite/${collectivite.data.id}/plans/${planId}$`)
    );
    await editPlanPom.expectPlanTitle(planNom);
    await editPlanPom.expectToggleAllAxesButtonShowsClose();
  });

  test("navigue vers l'axe du plan depuis la fiche", async ({
    page,
    collectivites,
    plans,
    fiches,
    editPlanPom,
    editAxePom,
  }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { role: 'admin', autoLogin: true },
    });

    const planNom = 'Plan navigation';
    const axeNom = 'Axe navigation';
    const ficheTitre = 'Fiche navigation';

    const planId = await plans.create(user, {
      nom: planNom,
      collectiviteId: collectivite.data.id,
    });

    const axeId = await plans.createAxe(user, {
      nom: axeNom,
      collectiviteId: collectivite.data.id,
      planId,
      parent: planId,
    });

    const [ficheId] = await fiches.create(user, [
      {
        titre: ficheTitre,
        collectiviteId: collectivite.data.id,
        axeId,
      },
    ]);

    await page.goto(
      `/collectivite/${collectivite.data.id}/actions/${ficheId}/details?planId=${planId}`
    );

    const axeBreadcrumb = page.getByRole('button', { name: axeNom });
    await expect(axeBreadcrumb).toBeVisible();
    await axeBreadcrumb.click();

    await expect(page).toHaveURL(
      new RegExp(
        `/collectivite/${collectivite.data.id}/plans/${planId}\\?openAxes=${axeId}$`
      )
    );
    await editPlanPom.expectPlanTitle(planNom);
    await editAxePom.expectAxeIsOpen(axeNom);
    await editPlanPom.expectToggleAllAxesButtonShowsOpen();
  });

  test('navigue vers un autre plan quand la fiche a plusieurs emplacements', async ({
    page,
    collectivites,
    plans,
    fiches,
    editPlanPom,
  }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { role: 'admin', autoLogin: true },
    });

    const planPrincipalNom = 'Plan principal navigation';
    const planSecondaireNom = 'Plan secondaire navigation';
    const axePrincipalNom = 'Axe principal navigation';
    const axeSecondaireNom = 'Axe secondaire navigation';

    const planPrincipalId = await plans.create(user, {
      nom: planPrincipalNom,
      collectiviteId: collectivite.data.id,
    });
    const planSecondaireId = await plans.create(user, {
      nom: planSecondaireNom,
      collectiviteId: collectivite.data.id,
    });

    const axePrincipalId = await plans.createAxe(user, {
      nom: axePrincipalNom,
      collectiviteId: collectivite.data.id,
      planId: planPrincipalId,
      parent: planPrincipalId,
    });
    const axeSecondaireId = await plans.createAxe(user, {
      nom: axeSecondaireNom,
      collectiviteId: collectivite.data.id,
      planId: planSecondaireId,
      parent: planSecondaireId,
    });

    const [ficheId] = await fiches.create(user, [
      {
        titre: 'Fiche multi plans navigation',
        collectiviteId: collectivite.data.id,
        axeIds: [axePrincipalId, axeSecondaireId],
      },
    ]);

    await page.goto(
      `/collectivite/${collectivite.data.id}/actions/${ficheId}/details?planId=${planPrincipalId}`
    );

    await page
      .getByRole('button', {
        name: /autre(s)? emplacement(s)? pour cette action/i,
      })
      .click();

    const otherPlanBreadcrumb = page.getByRole('button', {
      name: planSecondaireNom,
    });
    await expect(otherPlanBreadcrumb).toBeVisible();
    await otherPlanBreadcrumb.click();

    await expect(page).toHaveURL(
      new RegExp(
        `/collectivite/${collectivite.data.id}/plans/${planSecondaireId}$`
      )
    );
    await editPlanPom.expectPlanTitle(planSecondaireNom);
    await editPlanPom.expectToggleAllAxesButtonShowsClose();
  });
});

test.describe('Navigation entre les actions du plan', () => {
  test('parcourt les actions dans l’ordre du plan en conservant l’onglet Notes', async ({
    page,
    collectivites,
    plans,
    fiches,
    editPlanPom,
  }) => {
    test.slow();
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { role: 'admin', autoLogin: true },
    });
    const collectiviteId = collectivite.data.id;
    const planId = await plans.create(user, {
      nom: 'Plan à parcourir',
      collectiviteId,
    });
    const otherPlanId = await plans.create(user, {
      nom: 'Autre plan',
      collectiviteId,
    });
    // Ordre de création différent de l’ordre naturel d’affichage.
    const axe10Id = await plans.createAxe(user, {
      nom: 'Axe 10',
      collectiviteId,
      planId,
      parent: planId,
    });
    const axe2Id = await plans.createAxe(user, {
      nom: 'Axe 2',
      collectiviteId,
      planId,
      parent: planId,
    });
    const sousAxeId = await plans.createAxe(user, {
      nom: 'Sous-axe',
      collectiviteId,
      planId,
      parent: axe2Id,
    });
    await plans.createAxe(user, {
      nom: 'Axe 3 vide',
      collectiviteId,
      planId,
      parent: planId,
    });
    const [root10Id, root2Id, sharedId, sousAxeFicheId, lastId] =
      await fiches.create(user, [
        { titre: 'Action racine 10', collectiviteId, axeId: planId },
        { titre: 'Action racine 2', collectiviteId, axeId: planId },
        {
          titre: 'Action commune aux axes et aux plans',
          collectiviteId,
          axeIds: [axe2Id, axe10Id, otherPlanId],
        },
        { titre: 'Action du sous-axe', collectiviteId, axeId: sousAxeId },
        { titre: 'Dernière action', collectiviteId, axeId: axe10Id },
        { titre: 'Action de l’autre plan', collectiviteId, axeId: otherPlanId },
      ]);

    await editPlanPom.goto(collectiviteId, planId);
    await page
      .getByRole('article')
      .filter({ hasText: 'Action racine 2' })
      .getByRole('link')
      .click();
    await expect(page).toHaveURL(
      `/collectivite/${collectiviteId}/actions/${root2Id}/details?planId=${planId}`
    );

    const navigation = page.getByRole('navigation', {
      name: 'Navigation entre les actions du plan',
    });
    await expect(navigation).toHaveCount(2);
    await expect(
      navigation.first().getByRole('button', { name: 'Action précédente' })
    ).toBeDisabled();
    await expect(
      navigation.last().getByRole('button', { name: 'Action précédente' })
    ).toBeDisabled();

    await page.getByRole('tab', { name: 'Notes', exact: true }).click();
    await expect(page).toHaveURL(
      `/collectivite/${collectiviteId}/actions/${root2Id}/notes?planId=${planId}`
    );
    const followingFiches = [
      { id: root10Id, titre: 'Action racine 10' },
      { id: sharedId, titre: 'Action commune aux axes et aux plans' },
      { id: sousAxeFicheId, titre: 'Action du sous-axe' },
      { id: lastId, titre: 'Dernière action' },
    ];
    for (const fiche of followingFiches) {
      const href = `/collectivite/${collectiviteId}/actions/${fiche.id}/notes?planId=${planId}`;
      await expect(
        navigation.first().getByRole('link', { name: 'Action suivante' })
      ).toHaveAttribute('href', href);
      await expect(
        navigation.last().getByRole('link', { name: 'Action suivante' })
      ).toHaveAttribute('href', href);
      await navigation
        .last()
        .getByRole('link', { name: 'Action suivante' })
        .click();
      await expect(page).toHaveURL(href);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(
        fiche.titre
      );
      await expect(
        page.getByRole('tab', { name: 'Notes', exact: true })
      ).toHaveAttribute('aria-selected', 'true');
    }
    await expect(
      navigation.first().getByRole('button', { name: 'Action suivante' })
    ).toBeDisabled();
    await expect(
      navigation.last().getByRole('button', { name: 'Action suivante' })
    ).toBeDisabled();

    await navigation
      .first()
      .getByRole('link', { name: 'Action précédente' })
      .click();
    await expect(page).toHaveURL(
      `/collectivite/${collectiviteId}/actions/${sousAxeFicheId}/notes?planId=${planId}`
    );
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Action du sous-axe'
    );
    await page.reload();
    await expect(
      navigation.first().getByRole('link', { name: 'Action précédente' })
    ).toHaveAttribute(
      'href',
      `/collectivite/${collectiviteId}/actions/${sharedId}/notes?planId=${planId}`
    );

    await page.goto(
      `/collectivite/${collectiviteId}/actions/${sousAxeFicheId}/details`
    );
    await page.getByRole('tab', { name: 'Notes', exact: true }).click();
    await expect(page).toHaveURL(
      `/collectivite/${collectiviteId}/actions/${sousAxeFicheId}/notes`
    );
    await expect(navigation).toHaveCount(0);

    await user.getTrpcClient().plans.fiches.update.mutate({
      ficheId: root2Id,
      ficheFields: { statut: 'En cours' },
    });
    const filters = new URLSearchParams({
      filters: JSON.stringify({ statuts: ['En cours'] }),
    });
    await page.goto(
      `${editPlanPom.getPlanUrl(collectiviteId, planId)}?${filters}`
    );
    await expect(page.getByRole('article')).toHaveCount(1);
    await page
      .getByRole('article')
      .filter({ hasText: 'Action racine 2' })
      .getByRole('link')
      .click();
    await expect(page).toHaveURL(
      `/collectivite/${collectiviteId}/actions/${root2Id}/details?planId=${planId}`
    );
    await expect(
      navigation.first().getByRole('link', { name: 'Action suivante' })
    ).toHaveAttribute(
      'href',
      `/collectivite/${collectiviteId}/actions/${root10Id}/details?planId=${planId}`
    );
  });

  test('ignore les actions restreintes pour un visiteur', async ({
    page,
    collectivites,
    users,
    plans,
    fiches,
  }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      collectiviteArgs: { accesRestreint: false },
      userArgs: { role: 'admin', autoLogin: true },
    });
    const collectiviteId = collectivite.data.id;
    const planId = await plans.create(user, {
      nom: 'Plan public',
      collectiviteId,
    });
    const [firstId, restrictedId, lastId] = await fiches.create(user, [
      { titre: 'Action 1 publique', collectiviteId, axeId: planId },
      { titre: 'Action 2 restreinte', collectiviteId, axeId: planId },
      { titre: 'Action 3 publique', collectiviteId, axeId: planId },
    ]);
    await user.getTrpcClient().plans.fiches.update.mutate({
      ficheId: restrictedId,
      ficheFields: { restreint: true },
    });
    const visitor = await users.addUser({ collectiviteId: null });
    await visitor.login();

    await page.goto(
      `/collectivite/${collectiviteId}/actions/${firstId}/details?planId=${planId}`
    );
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Action 1 publique'
    );
    const navigation = page
      .getByRole('navigation', {
        name: 'Navigation entre les actions du plan',
      })
      .first();
    await expect(
      navigation.getByRole('link', { name: 'Action suivante' })
    ).toHaveAttribute(
      'href',
      `/collectivite/${collectiviteId}/actions/${lastId}/details?planId=${planId}`
    );
    await navigation.getByRole('link', { name: 'Action suivante' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Action 3 publique'
    );
    await expect(
      navigation.getByRole('button', { name: 'Action suivante' })
    ).toBeDisabled();
    await navigation.getByRole('link', { name: 'Action précédente' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Action 1 publique'
    );
    await page.reload();
    await expect(
      navigation.getByRole('link', { name: 'Action suivante' })
    ).toHaveAttribute(
      'href',
      `/collectivite/${collectiviteId}/actions/${lastId}/details?planId=${planId}`
    );
  });

  test('masque la navigation quand la fiche est seule dans le plan', async ({
    page,
    collectivites,
    plans,
    fiches,
    editPlanPom,
  }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { role: 'admin', autoLogin: true },
    });
    const collectiviteId = collectivite.data.id;
    const planId = await plans.create(user, {
      nom: 'Plan avec une action',
      collectiviteId,
    });
    const [ficheId] = await fiches.create(user, [
      { titre: 'Action seule', collectiviteId, axeId: planId },
    ]);

    await editPlanPom.goto(collectiviteId, planId);
    await editPlanPom.expectFicheExists('Action seule');
    const navigationFichesLoaded = page.waitForResponse(
      (response) =>
        response.url().includes('plans.fiches.listFiches') &&
        decodeURIComponent(response.url()).includes(
          `"planActionIds":[${planId}]`
        )
    );
    await page
      .getByRole('article')
      .filter({ hasText: 'Action seule' })
      .getByRole('link')
      .click();
    const response = await navigationFichesLoaded;
    await response.finished();
    expect(response.ok()).toBe(true);
    await expect(page).toHaveURL(
      `/collectivite/${collectiviteId}/actions/${ficheId}/details?planId=${planId}`
    );
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Action seule'
    );
    const navigation = page.getByRole('navigation', {
      name: 'Navigation entre les actions du plan',
    });
    await expect(navigation).toHaveCount(0);
  });
});
