import { expect, Locator, Page } from '@playwright/test';

export class UpdateUserPom {
  readonly monCompteSection: Locator;
  readonly modifierButton: Locator;
  readonly modal: Locator;
  readonly prenomInput: Locator;
  readonly nomInput: Locator;
  readonly emailInput: Locator;
  readonly telephoneInput: Locator;
  readonly modalSubmitButton: Locator;
  readonly modalCancelButton: Locator;
  readonly prenomNomDisplay: Locator;
  readonly emailDisplay: Locator;
  readonly telephoneDisplay: Locator;

  constructor(public readonly page: Page) {
    this.page = page;
    this.monCompteSection = page.locator('[data-test="MonCompte"]');
    this.modifierButton = page
      .locator('[data-test="MonCompte"]')
      .getByRole('button', { name: 'Modifier' });
    this.modal = page.getByRole('dialog', {
      name: 'Modifier mes informations',
    });
    this.prenomInput = this.modal.locator('#prenom');
    this.nomInput = this.modal.locator('#nom');
    this.emailInput = this.modal.locator('#email');
    this.telephoneInput = this.modal.locator('#telephone');
    this.modalSubmitButton = this.modal.getByRole('button', {
      name: 'Valider',
    });
    this.modalCancelButton = this.modal.getByRole('button', {
      name: 'Annuler',
    });
    // Selector for prenom/nom: find the section with "Prénom et nom" label, then get the value span
    this.prenomNomDisplay = page
      .locator('[data-test="MonCompte"]')
      .getByText('Prénom et nom')
      .locator('..')
      .locator('span')
      .filter({ hasNotText: 'Prénom et nom' });
    // Selector for email: find the section with "Email" label, then get the value span (first one that's not the label)
    this.emailDisplay = page
      .locator('[data-test="MonCompte"]')
      .getByText('Email')
      .locator('..')
      .locator('span')
      .filter({ hasNotText: 'Email' })
      .first();
    // Selector for telephone: find the section with "Numéro de téléphone" label, then get the value span
    this.telephoneDisplay = page
      .locator('[data-test="MonCompte"]')
      .getByText('Numéro de téléphone')
      .locator('..')
      .locator('span')
      .filter({ hasNotText: 'Numéro de téléphone' })
      .first();
  }

  async goto() {
    await this.page.goto('/profil');
    await expect(this.monCompteSection).toBeVisible();
  }

  async openEditModal() {
    await this.modifierButton.click();
    await expect(this.modal).toBeVisible();
  }

  async closeEditModal() {
    await this.modalCancelButton.click();
    await expect(this.modal).toBeHidden();
  }

  async fillForm(data: {
    prenom?: string;
    nom?: string;
    email?: string;
    telephone?: string;
  }) {
    // Wait for inputs to be visible and filled with default values
    await expect(this.prenomInput).toBeVisible();
    await expect(this.nomInput).toBeVisible();
    await expect(this.telephoneInput).toBeVisible();

    if (data.prenom !== undefined) {
      await this.prenomInput.clear();
      await this.prenomInput.fill(data.prenom);
      // Trigger blur to validate
      await this.prenomInput.blur();
    }
    if (data.nom !== undefined) {
      await this.nomInput.clear();
      await this.nomInput.fill(data.nom);
      await this.nomInput.blur();
    }
    if (data.email !== undefined) {
      await this.emailInput.clear();
      await this.emailInput.fill(data.email);
      await this.emailInput.blur();
    }
    if (data.telephone !== undefined) {
      await this.telephoneInput.clear();
      await this.telephoneInput.fill(data.telephone);
      await this.telephoneInput.blur();
    }
  }

  async submitForm() {
    await this.modalSubmitButton.click();
    await expect(this.modal).toBeHidden();
  }

  async expectPrenomNom(expected: string) {
    await expect(this.prenomNomDisplay).toHaveText(expected);
  }

  async expectEmail(expected: string) {
    await expect(this.emailDisplay).toHaveText(expected);
  }

  async expectTelephone(expected: string | null | undefined) {
    await expect(this.telephoneDisplay).toHaveText(expected ?? 'Non renseigné');
  }
}
