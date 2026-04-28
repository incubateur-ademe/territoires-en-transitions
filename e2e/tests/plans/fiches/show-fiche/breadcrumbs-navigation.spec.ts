import { expect } from '@playwright/test';
import { testWithPlans } from 'tests/plans/plans/plans.fixture';

const test = testWithPlans;

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
