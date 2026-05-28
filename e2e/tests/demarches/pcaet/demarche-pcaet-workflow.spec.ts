import { expect } from '@playwright/test';
import { test } from 'tests/main.fixture';

test.describe('Démarche PCAET - workflow plan actions', () => {
  test('création de démarche sans plan PCAET existant', async ({
    collectivites,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    plans, // requis pour cleanup auto
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });

    await page.goto(`/collectivite/${collectivite.data.id}/demarche-pcaet`);
    await expect(page).toHaveURL(
      `/collectivite/${collectivite.data.id}/demarche-pcaet/nouveau`
    );

    await page.getByRole('button', { name: 'Créer la démarche' }).click();
    await expect(page).toHaveURL(
      new RegExp(`/collectivite/${collectivite.data.id}/demarche-pcaet/.+`)
    );

    const createPlanButton = page.getByTestId('demarche-creer-plan-pcaet');
    await expect(createPlanButton).toBeVisible();
    await expect(createPlanButton).toHaveAttribute(
      'href',
      `/collectivite/${collectivite.data.id}/plans/creer`
    );
  });

  test('création de démarche puis rattachement manuel à un plan PCAET existant', async ({
    collectivites,
    createPlanPom,
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });

    const planNom = 'PCAET existant à lier';
    await createPlanPom.goto(collectivite.data.id);
    await createPlanPom.fillNom(planNom);
    await createPlanPom.selectType('Plan Climat Air Énergie Territorial');
    await createPlanPom.submit();
    await createPlanPom.expectSuccess(collectivite.data.id);

    await page.goto(`/collectivite/${collectivite.data.id}/demarche-pcaet`);
    await expect(page).toHaveURL(
      `/collectivite/${collectivite.data.id}/demarche-pcaet/nouveau`
    );

    await page.getByRole('button', { name: 'Créer la démarche' }).click();
    await expect(page).toHaveURL(
      new RegExp(`/collectivite/${collectivite.data.id}/demarche-pcaet/.+`)
    );

    await expect(page.getByTestId('demarche-plan-select')).toBeVisible();
    await page.getByTestId('demarche-link-plan').click();

    await expect(page.getByTestId('demarche-plan-header')).toBeVisible();
    await expect(page.getByTestId('demarche-plan-header')).toContainText(
      planNom
    );
  });
});

