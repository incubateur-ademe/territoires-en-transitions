import { expect, Page } from '@playwright/test';

function toRandomCase(s: string) {
  return Array.from(s)
    .map((l) =>
      (Math.random() < 0.5
        ? String.prototype.toLowerCase
        : String.prototype.toUpperCase
      ).apply(l)
    )
    .join('');
}

export class SigninUserPom {
  constructor(public readonly page: Page) {}

  /** Navigue vers la page de connexion et sélectionne l'onglet voulu */
  async goToAuthUrl(
    { tab }: { tab: 'sans-mdp' | 'avec-mdp' } = { tab: 'avec-mdp' }
  ) {
    await this.page.goto('/');

    const loginButton = this.page
      .locator('header')
      .getByRole('link', { name: 'Se connecter' });

    await expect(loginButton).toBeVisible();
    await loginButton.click();

    const passwordTab = this.page.getByRole('tab', {
      name: `Connexion ${tab === 'avec-mdp' ? 'avec' : 'sans'} mot de passe`,
    });

    await expect(passwordTab).toBeVisible();
    await passwordTab.click();

    await expect(
      this.page.getByRole('textbox', { name: 'Email de connexion' })
    ).toBeVisible();
  }

  /** Remplit le formulaire de connexion et le soumet */
  async fillAndSubmitLoginForm(email: string, password?: string) {
    await this.page
      .getByRole('textbox', { name: 'Email de connexion' })
      .fill(toRandomCase(email));

    if (password) {
      await this.page
        .getByRole('textbox', { name: 'Mot de passe' })
        .fill(password);
    }

    await this.page.getByRole('button', { name: 'Valider' }).click();
  }
}
