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

    // La page de signup s'affiche (servie par l'app, same-origin)
    await expect(this.page.getByTestId('SignUpPage')).toBeVisible({
      timeout: 15000,
    });
  }

  /**
   * Étape 1 : saisir l'email (et éventuellement le mot de passe), puis soumettre.
   * Sans `password` → onglet « Compte sans mot de passe ».
   */
  async fillStep1(email: string, password?: string) {
    const isPasswordless = password === undefined;

    const tab = this.page.getByRole('tab', {
      name: isPasswordless
        ? 'Compte sans mot de passe'
        : 'Compte avec mot de passe',
    });
    await expect(tab).toBeVisible();
    await tab.click();

    const emailInput = this.page.locator('#email');
    await expect(emailInput).toBeVisible();
    await emailInput.fill(email);

    if (!isPasswordless) {
      const passwordInput = this.page.locator('#password');
      await expect(passwordInput).toBeVisible();
      await passwordInput.fill(password);

      // Attendre que le bouton Valider soit actif (vérification mdp robuste)
      const submitButton = this.page.getByRole('button', { name: 'Valider' });
      await expect(submitButton).toBeEnabled({ timeout: 5000 });
      await submitButton.click();
      return;
    }

    const submitButton = this.page.getByRole('button', { name: 'Valider' });
    await expect(submitButton).toBeEnabled({ timeout: 5000 });
    await submitButton.click();
  }

  /** Après inscription sans mdp : le message « lien envoyé » s'affiche */
  async expectPasswordlessLinkSent() {
    await expect(this.page.getByTestId('auth.signup.lien-envoye')).toBeVisible({
      timeout: 10000,
    });
  }

  /**
   * Simule le clic sur le lien magique reçu par email (template magic_link.html),
   * puis valide le code OTP prérempli sur /login?view=verify.
   */
  async completeMagicLink(email: string, otp: string) {
    const params = new URLSearchParams({
      view: 'verify',
      email,
      otp,
      redirect_to: '/',
    });
    await this.page.goto(`/login?${params.toString()}`);

    await expect(
      this.page.getByTestId('auth.verify-otp.lien-envoye')
    ).toBeVisible({ timeout: 10000 });

    const submitButton = this.page.getByTestId('auth.verify-otp.valider-button');
    await expect(submitButton).toBeEnabled({ timeout: 5000 });
    await submitButton.click();
  }

  /**
   * Après le lien magique, deux arrivées possibles selon que `sync_dcp` a déjà
   * créé une DCP :
   * - pas de DCP → `/signup?view=etape3` (formulaire nom/prénom + CGU)
   * - DCP vide   → `/finaliser-mon-inscription` + modale « Accepter CGU »
   */
  async completePasswordlessProfile(data: {
    nom: string;
    prenom: string;
    telephone: string;
  }): Promise<'etape3' | 'cgu-modal'> {
    const etape3Nom = this.page.locator('#nom');
    const cguAcceptButton = this.page.getByRole('button', {
      name: 'Accepter et poursuivre',
    });

    await expect(etape3Nom.or(cguAcceptButton)).toBeVisible({
      timeout: 20000,
    });

    if (await etape3Nom.isVisible()) {
      await this.fillStep3(data);
      return 'etape3';
    }

    await cguAcceptButton.click();
    // La modale se ferme immédiatement (optimistic) avant la fin de la mutation
    await expect(cguAcceptButton).toBeHidden({ timeout: 10000 });
    await this.page.getByTestId('nav-user').waitFor({ state: 'visible' });
    return 'cgu-modal';
  }

  /** Étape 2 : saisir le code OTP reçu par email (parcours avec mot de passe) */
  async fillStep2(otp: string) {
    // Avec mot de passe, l'inscription passe par VerifyOTP (etape2), pas msg_lien_envoye
    await expect(
      this.page.getByTestId('auth.verify-otp.lien-envoye')
    ).toBeVisible({
      timeout: 10000,
    });

    const otpInput = this.page.getByTestId('auth.verify-otp.otp-input');
    await expect(otpInput).toBeVisible();
    await otpInput.pressSequentially(otp);

    const submitButton = this.page.getByRole('button', { name: 'Valider' });
    await expect(submitButton).toBeEnabled();
    await submitButton.click();
  }

  /** Étape 3 : renseigner les informations personnelles et accepter les CGU */
  async fillStep3(data: { nom: string; prenom: string; telephone: string }) {
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
  async expectSignupComplete(user: { prenom: string }) {
    await expect(this.page).toHaveURL(/finaliser-mon-inscription/, {
      timeout: 15000,
    });

    await expect(
      this.page.getByRole('heading', {
        name: 'Merci pour votre inscription !',
      })
    ).toBeVisible();

    const userPrenomButton = this.page
      .locator('[data-test="nav-user"]')
      .getByText(user.prenom);

    await expect(userPrenomButton).toBeVisible();
  }

  /** Vérifie le message d'email déjà associé à un compte */
  async expectEmailAlreadyExists() {
    await expect(
      this.page.getByText("L'email est déjà associé à un compte existant.")
    ).toBeVisible({ timeout: 10000 });

    await expect(
      this.page.getByRole('link', { name: 'Se connecter' })
    ).toBeVisible();
  }
}
