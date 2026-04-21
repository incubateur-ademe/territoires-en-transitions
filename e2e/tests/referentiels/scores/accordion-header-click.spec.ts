import { expect } from '@playwright/test';
import { testWithReferentiels as test } from '../referentiels.fixture';

test.describe("Clic sur le header d'une sous-action pour déplier/replier", () => {
  test.beforeEach(async ({ page, collectivites }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
      collectiviteArgs: { isCOT: true },
    });
    await user.precomputeReferentielSnapshot(collectivite.data.id, 'cae');
    await page.goto('/');
  });

  test('Cliquer sur le header (hors bouton flèche) déplie la sous-action', async ({
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

    const expandButton =
      referentielScoresPom.getSousActionExpandLocator('1.1.1.1');
    await expect(expandButton).toHaveAttribute('aria-expanded', 'false');

    // Clic sur le titre de la sous-action (pas sur la flèche)
    const header = page.locator('[data-test="SousActionHeader-1.1.1.1"]');
    await header.locator('.text-primary-9.text-base.font-bold').click();

    await expect(expandButton).toHaveAttribute('aria-expanded', 'true');
  });

  test('Cliquer sur le header replie une sous-action déjà dépliée', async ({
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

    // D'abord déplier via le bouton flèche
    await referentielScoresPom.expandSousAction('1.1.1.1');
    const expandButton =
      referentielScoresPom.getSousActionExpandLocator('1.1.1.1');
    await expect(expandButton).toHaveAttribute('aria-expanded', 'true');

    // Puis cliquer sur le titre pour replier
    const header = page.locator('[data-test="SousActionHeader-1.1.1.1"]');
    await header.locator('.text-primary-9.text-base.font-bold').click();

    await expect(expandButton).toHaveAttribute('aria-expanded', 'false');
  });

  test('Le bouton documents ouvre le side panel sans déplier la sous-action', async ({
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

    const expandButton =
      referentielScoresPom.getSousActionExpandLocator('1.1.1.1');
    await expect(expandButton).toHaveAttribute('aria-expanded', 'false');

    // Cliquer sur le bouton documents
    const sousAction = page.locator('[id="cae_1.1.1.1"]');
    await sousAction.getByRole('button', { name: /document/i }).click();

    // Le side panel documents doit s'ouvrir
    await expect(page).toHaveURL(/panel=documents/);

    // La sous-action ne doit pas se déplier
    await expect(expandButton).toHaveAttribute('aria-expanded', 'false');
  });

  test('Le bouton commentaires ouvre le side panel sans déplier la sous-action', async ({
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

    const expandButton =
      referentielScoresPom.getSousActionExpandLocator('1.1.1.1');
    await expect(expandButton).toHaveAttribute('aria-expanded', 'false');

    // Cliquer sur le bouton commentaires
    const sousAction = page.locator('[id="cae_1.1.1.1"]');
    await sousAction.getByRole('button', { name: /commentaire/i }).click();

    // Le side panel commentaires doit s'ouvrir
    await expect(page).toHaveURL(/panel=comments/);

    // La sous-action ne doit pas se déplier
    await expect(expandButton).toHaveAttribute('aria-expanded', 'false');
  });

  test('Cliquer dans le champ de justification ne déplie pas la sous-action', async ({
    page: _,
    referentielScoresPom,
    referentiels: __,
  }) => {
    await referentielScoresPom.goto('cae');
    await referentielScoresPom.goToActionPage(
      '1 - Planification',
      '1.1 Stratégie globale',
      '1.1.1 Définir la vision, les'
    );

    const expandButton =
      referentielScoresPom.getSousActionExpandLocator('1.1.1.1');
    await expect(expandButton).toHaveAttribute('aria-expanded', 'false');

    const commentaireEditor =
      referentielScoresPom.getActionCommentaireLocator('cae_1.1.1.1');
    await commentaireEditor.click();

    // L'éditeur doit avoir le focus
    await expect(commentaireEditor).toBeFocused();

    // La sous-action ne doit pas se déplier
    await expect(expandButton).toHaveAttribute('aria-expanded', 'false');
  });
});
