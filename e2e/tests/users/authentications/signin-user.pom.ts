import { expect, Page } from '@playwright/test';

function toRandomCase(s: string) {
  return Array.from(s)
    .map((char, index) =>
      index % 2 === 0 ? char.toLowerCase() : char.toUpperCase()
    )
    .join('');
}

export class SigninUserPom {
  constructor(public readonly page: Page) {}

  /** Navigue vers la page de connexion et sélectionne l'onglet voulu */
  async goToAuthUrl(
    { tab }: { tab: 'sans-mdp' | 'avec-mdp' } = { tab: 'avec-mdp' }
  ) {
    // `domcontentloaded` : on n'attend pas le `load` complet (l'image `eager` de
    // la home peut dépasser 30 s en CI et faisait échouer le `page.goto`).
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });

    const loginButton = this.page
      .locator('header')
      .getByRole('link', { name: 'Se connecter' });

    await expect(loginButton).toBeVisible();
    await loginButton.click();

    const authTab = this.page.getByRole('tab', {
      name:
        tab === 'avec-mdp'
          ? 'Connexion avec mot de passe'
          : 'Recevoir un lien de connexion',
    });

    await expect(authTab).toBeVisible();
    await authTab.click();

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
