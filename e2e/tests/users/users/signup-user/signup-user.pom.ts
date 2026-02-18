import { expect, Page } from '@playwright/test';

export class SignupUserPom {
  constructor(public readonly page: Page) {}

  /** Navigate to the home page and click "Créer un compte" */
  async gotoSignup() {
    await this.page.goto('/');

    const signupLink = this.page
      .locator('header')
      .getByRole('link', { name: 'Créer un compte' });

    await expect(signupLink).toBeVisible();
    await signupLink.click();

    // La modale de signup s'affiche (on est redirigé vers l'app auth)
    await expect(
      this.page.getByTestId('SignUpPage')
    ).toBeVisible({ timeout: 15000 });
  }

  /** Étape 1 : saisir l'email et le mot de passe, puis soumettre */
  async fillStep1(email: string, password: string) {
    const emailInput = this.page.locator('#email');
    const passwordInput = this.page.locator('#password');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    await emailInput.fill(email);
    await passwordInput.fill(password);

    // Attendre que le bouton Valider soit actif (vérification mdp robuste)
    const submitButton = this.page.getByRole('button', { name: 'Valider' });
    await expect(submitButton).toBeEnabled({ timeout: 5000 });
    await submitButton.click();
  }

  /** Étape 2 : saisir le code OTP reçu par email */
  async fillStep2(otp: string) {
    // Attendre le message "veuillez consulter votre boite mail"
    await expect(
      this.page.getByTestId('lien-envoye')
    ).toBeVisible({ timeout: 10000 });

    // Saisir le code OTP (6 chiffres) via l'input formaté
    const otpInput = this.page.locator('input[name="otp"]');
    await expect(otpInput).toBeVisible();
    await otpInput.pressSequentially(otp);

    const submitButton = this.page.getByRole('button', { name: 'Valider' });
    await expect(submitButton).toBeEnabled();
    await submitButton.click();
  }

  /** Étape 3 : renseigner les informations personnelles et accepter les CGU */
  async fillStep3(data: {
    nom: string;
    prenom: string;
    telephone: string;
  }) {
    const nomInput = this.page.locator('#nom');
    const prenomInput = this.page.locator('#prenom');
    const telephoneInput = this.page.locator('#telephone');

    await expect(nomInput).toBeVisible({ timeout: 10000 });

    await nomInput.fill(data.nom);
    await prenomInput.fill(data.prenom);
    await telephoneInput.pressSequentially(data.telephone);

    // Cocher la case d'acceptation des CGU
    await this.page.getByTestId('accept-cgu').click();

    const submitButton = this.page.getByRole('button', { name: 'Valider' });
    await expect(submitButton).toBeEnabled({ timeout: 5000 });
    await submitButton.click();
  }

  /** Vérifie que l'inscription est terminée et que l'on est redirigé vers l'app */
  async expectSignupComplete() {
    await expect(this.page).toHaveURL(/finaliser-mon-inscription/, {
      timeout: 15000,
    });

    await expect(
      this.page.getByRole('heading', {
        name: 'Merci pour votre inscription !',
      })
    ).toBeVisible();
  }
}
