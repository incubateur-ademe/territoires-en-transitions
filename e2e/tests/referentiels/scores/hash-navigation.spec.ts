import { expect } from '@playwright/test';
import { testWithReferentiels as test } from '../referentiels.fixture';

test.describe('Navigation par hash vers une sous-action', () => {
  test.beforeEach(async ({ page, collectivites }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
      collectiviteArgs: { isCOT: true },
    });
    await user.precomputeReferentielSnapshot(collectivite.data.id, 'cae');
    await page.goto('/');
  });

  test('Le hash auto-expand la sous-action ciblée et scrolle', async ({
    page,
    referentielScoresPom,
    referentiels: _,
  }) => {
    await referentielScoresPom.goto('cae');
    await referentielScoresPom.goToActionPage(
      '1 - Planification',
      '1.1 Stratégie globale',
      '1.1.1 Définir la vision, les'
    );

    const url = page.url();
    await page.goto(`${url}#cae_1.1.1.3`);

    const sousAction = page.locator('[id="cae_1.1.1.3"]');
    await expect(sousAction).toBeVisible();
    await expect(
      sousAction.getByRole('button', {
        name: 'Déplier la sous-action 1.1.1.3',
      })
    ).toHaveAttribute('aria-expanded', 'true');
  });

  test("L'utilisateur peut replier une sous-action auto-expandée par le hash", async ({
    page,
    referentielScoresPom,
    referentiels: _,
  }) => {
    await referentielScoresPom.goto('cae');
    await referentielScoresPom.goToActionPage(
      '1 - Planification',
      '1.1 Stratégie globale',
      '1.1.1 Définir la vision, les'
    );

    const url = page.url();
    await page.goto(`${url}#cae_1.1.1.3`);

    const expandButton = page.getByRole('button', {
      name: 'Déplier la sous-action 1.1.1.3',
    });
    await expect(expandButton).toHaveAttribute('aria-expanded', 'true');

    await expandButton.click();
    await expect(expandButton).toHaveAttribute('aria-expanded', 'false');
  });

  test('Les autres sous-actions restent fermées quand le hash en cible une seule', async ({
    page,
    referentielScoresPom,
    referentiels: _,
  }) => {
    await referentielScoresPom.goto('cae');
    await referentielScoresPom.goToActionPage(
      '1 - Planification',
      '1.1 Stratégie globale',
      '1.1.1 Définir la vision, les'
    );

    const url = page.url();
    await page.goto(`${url}#cae_1.1.1.3`);

    await expect(
      page.getByRole('button', { name: 'Déplier la sous-action 1.1.1.3' })
    ).toHaveAttribute('aria-expanded', 'true');

    await expect(
      page.getByRole('button', { name: 'Déplier la sous-action 1.1.1.1' })
    ).toHaveAttribute('aria-expanded', 'false');
  });

  test('Changer de hash expand la nouvelle sous-action et ferme la précédente', async ({
    page,
    referentielScoresPom,
    referentiels: _,
  }) => {
    await referentielScoresPom.goto('cae');
    await referentielScoresPom.goToActionPage(
      '1 - Planification',
      '1.1 Stratégie globale',
      '1.1.1 Définir la vision, les'
    );

    const url = page.url();
    await page.goto(`${url}#cae_1.1.1.3`);

    await expect(
      page.getByRole('button', { name: 'Déplier la sous-action 1.1.1.3' })
    ).toHaveAttribute('aria-expanded', 'true');

    await page.evaluate(() => {
      window.location.hash = 'cae_1.1.1.1';
    });

    await expect(
      page.getByRole('button', { name: 'Déplier la sous-action 1.1.1.1' })
    ).toHaveAttribute('aria-expanded', 'true');

    await expect(
      page.getByRole('button', { name: 'Déplier la sous-action 1.1.1.3' })
    ).toHaveAttribute('aria-expanded', 'false');
  });

  test(`Tout déplier" fonctionne même avec un hash dans l'URL`, async ({
    page,
    referentielScoresPom,
    referentiels: _,
  }) => {
    await referentielScoresPom.goto('cae');
    await referentielScoresPom.goToActionPage(
      '1 - Planification',
      '1.1 Stratégie globale',
      '1.1.1 Définir la vision, les'
    );

    const url = page.url();
    await page.goto(`${url}#cae_1.1.1.3`);

    await expect(
      page.getByRole('button', { name: 'Déplier la sous-action 1.1.1.3' })
    ).toHaveAttribute('aria-expanded', 'true');

    await page.getByRole('button', { name: 'Tout déplier' }).click();

    await expect(
      page.getByRole('button', { name: 'Déplier la sous-action 1.1.1.1' })
    ).toHaveAttribute('aria-expanded', 'true');
    await expect(
      page.getByRole('button', { name: 'Déplier la sous-action 1.1.1.3' })
    ).toHaveAttribute('aria-expanded', 'true');
  });

  test('"Tout replier" ferme les autres sous-actions mais celle ciblée par le hash reste ouverte', async ({
    page,
    referentielScoresPom,
    referentiels: _,
  }) => {
    await referentielScoresPom.goto('cae');
    await referentielScoresPom.goToActionPage(
      '1 - Planification',
      '1.1 Stratégie globale',
      '1.1.1 Définir la vision, les'
    );

    const url = page.url();
    await page.goto(`${url}#cae_1.1.1.3`);

    await expect(
      page.getByRole('button', { name: 'Déplier la sous-action 1.1.1.3' })
    ).toHaveAttribute('aria-expanded', 'true');

    await page.getByRole('button', { name: 'Tout déplier' }).click();
    await page.getByRole('button', { name: 'Tout replier' }).click();

    await expect(
      page.getByRole('button', { name: 'Déplier la sous-action 1.1.1.3' })
    ).toHaveAttribute('aria-expanded', 'true');
    await expect(
      page.getByRole('button', { name: 'Déplier la sous-action 1.1.1.1' })
    ).toHaveAttribute('aria-expanded', 'false');
  });
});

test.describe('Panel historique et navigation', () => {
  test.beforeEach(async ({ page, collectivites }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
      collectiviteArgs: { isCOT: true },
    });
    await user.precomputeReferentielSnapshot(collectivite.data.id, 'cae');
    await page.goto('/');
  });

  test(`Le panel historique reste ouvert après clic sur "Voir l'action"`, async ({
    page,
    referentielScoresPom,
    referentiels: _,
  }) => {
    await referentielScoresPom.goto('cae');
    await referentielScoresPom.goToActionPage(
      '1 - Planification',
      '1.1 Stratégie globale',
      '1.1.1 Définir la vision, les'
    );

    await referentielScoresPom.updateSousActionAvancement('1.1.1.3', 'fait');

    const toolbar = page.getByRole('toolbar', {
      name: 'Panneaux latéraux',
    });
    await toolbar.getByRole('button', { name: 'Historique' }).click();

    const voirLaPage = page
      .getByRole('link', { name: "Voir l'action" })
      .first();
    await expect(voirLaPage).toBeVisible();
    await voirLaPage.click();

    await expect(page).toHaveURL(/panel=historique/);
  });

  test(`"Voir l'action" pour une sous-action : expand et garde le panel ouvert`, async ({
    page,
    referentielScoresPom,
    referentiels: _,
  }) => {
    await referentielScoresPom.goto('cae');
    await referentielScoresPom.goToActionPage(
      '1 - Planification',
      '1.1 Stratégie globale',
      '1.1.1 Définir la vision, les'
    );

    await referentielScoresPom.updateSousActionAvancement('1.1.1.1', 'fait');

    const toolbar = page.getByRole('toolbar', {
      name: 'Panneaux latéraux',
    });
    await toolbar.getByRole('button', { name: 'Historique' }).click();

    const voirLaPage = page
      .getByRole('link', { name: "Voir l'action" })
      .first();
    await expect(voirLaPage).toBeVisible();
    await voirLaPage.click();

    await expect(page).toHaveURL(/panel=historique/);
    const sousAction = page.locator('[id="cae_1.1.1.1"]');
    await expect(
      sousAction.getByRole('button', {
        name: 'Déplier la sous-action 1.1.1.1',
      })
    ).toHaveAttribute('aria-expanded', 'true');
    await expect(sousAction).toBeInViewport();
  });

  test(`"Voir l'action" pour une tâche : expand la sous-action parente et garde le panel ouvert`, async ({
    page,
    referentielScoresPom,
    referentiels: _,
  }) => {
    await referentielScoresPom.goto('cae');
    await referentielScoresPom.goToActionPage(
      '1 - Planification',
      '1.1 Stratégie globale',
      '1.1.1 Définir la vision, les'
    );

    await referentielScoresPom.expandSousAction('1.1.1.1');
    await referentielScoresPom.updateTacheAvancement('1.1.1.1.1', 'fait');

    const toolbar = page.getByRole('toolbar', {
      name: 'Panneaux latéraux',
    });
    await toolbar.getByRole('button', { name: 'Historique' }).click();

    const voirLaPage = page
      .getByRole('link', { name: "Voir l'action" })
      .first();
    await expect(voirLaPage).toBeVisible();
    await voirLaPage.click();

    await expect(page).toHaveURL(/panel=historique/);
    await expect(page).toHaveURL(/#cae_1\.1\.1\.1\.1/);
    const sousAction = page.locator('[id="cae_1.1.1.1"]');
    await expect(
      sousAction.getByRole('button', {
        name: 'Déplier la sous-action 1.1.1.1',
      })
    ).toHaveAttribute('aria-expanded', 'true');
    await expect(sousAction).toBeInViewport();
  });

  test('Le panel historique reste ouvert pour une action sans hash', async ({
    page,
    referentielScoresPom,
    referentiels: _,
  }) => {
    await referentielScoresPom.goto('cae');
    await referentielScoresPom.goToActionPage(
      '1 - Planification',
      '1.1 Stratégie globale',
      '1.1.1 Définir la vision, les'
    );

    await referentielScoresPom.updateSousActionAvancement('1.1.1.3', 'fait');

    const toolbar = page.getByRole('toolbar', {
      name: 'Panneaux latéraux',
    });
    await toolbar.getByRole('button', { name: 'Historique' }).click();

    const voirLaPage = page
      .getByRole('link', { name: "Voir l'action" })
      .first();
    await voirLaPage.click();

    await expect(page).toHaveURL(/panel=historique/);
    expect(page.url()).not.toContain('#');
  });
});
