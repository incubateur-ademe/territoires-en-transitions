import { expect } from '@playwright/test';
import { testWithPlans } from 'tests/plans/plans/plans.fixture';

const test = testWithPlans;

const PLAN_NAME = 'Plan climat mutualisation';
const LEAF_AXE_NAME = 'Mobilités douces';

test.describe("Mutualiser l'action dans un autre plan", () => {
  test("rattache l'action à un axe sans sous-axe", async ({
    page,
    collectivites,
    plans,
    fiches,
  }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', (error) => pageErrors.push(error));

    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { role: 'admin', autoLogin: true },
    });
    const collectiviteId = collectivite.data.id;

    const planId = await plans.create(user, {
      nom: PLAN_NAME,
      collectiviteId,
    });

    await plans.createAxe(user, {
      nom: LEAF_AXE_NAME,
      collectiviteId,
      planId,
      parent: planId,
    });

    const [ficheId] = await fiches.create(user, [
      { titre: 'Action à mutualiser', collectiviteId },
    ]);

    await page.goto(
      `/collectivite/${collectiviteId}/actions/${ficheId}/details`
    );

    await page.getByRole('button', { name: "Plus d'options" }).click();
    await page
      .getByRole('button', { name: "Mutualiser l'action dans un autre plan" })
      .click();

    const modal = page.getByRole('dialog');
    await modal.getByRole('tab', { name: 'Emplacement additionnel' }).click();

    await modal.getByRole('button', { name: PLAN_NAME }).click();
    await modal.getByRole('button', { name: LEAF_AXE_NAME }).click();

    const validateButton = modal.getByRole('button', {
      name: 'Valider cet emplacement',
    });
    await expect(validateButton).toBeEnabled();
    await validateButton.click();

    await expect(
      modal.getByRole('tab', { name: 'Emplacement actuel' })
    ).toHaveAttribute('aria-selected', 'true');
    await expect(
      modal.getByText('1 emplacement sélectionné pour cette action')
    ).toBeVisible();
    await expect(modal.getByText(PLAN_NAME)).toBeVisible();
    await expect(modal.getByText(LEAF_AXE_NAME)).toBeVisible();

    expect(pageErrors).toEqual([]);
  });
});
