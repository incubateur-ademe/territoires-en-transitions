import { expect, Locator, Page } from '@playwright/test';
import { CollectiviteRole } from '@tet/domain/users';
import { DropdownPom } from 'tests/shared/dropdown.pom';

export class InviteMembrePom {
  readonly inviteButton: Locator;
  readonly modal: Locator;
  readonly emailInput: Locator;
  readonly niveauDropdown: DropdownPom;
  readonly submitButton: Locator;

  constructor(public readonly page: Page) {
    this.inviteButton = page.locator('[data-test="invite"]');
    this.modal = page.getByRole('dialog', { name: 'Inviter un membre' });
    this.emailInput = page.locator('#email');
    this.niveauDropdown = new DropdownPom(
      page,
      page.locator('[data-test="niveau"]')
    );
    this.submitButton = this.modal.locator('[data-test="ok"]');
  }

  /** Navigue vers la page des membres de la collectivité */
  async gotoUsersPage(collectiviteId: number) {
    await this.page.goto(`/collectivite/${collectiviteId}/users`);
    await expect(this.page.locator('[data-test="Users"]')).toBeVisible();
  }

  /** Ouvre la modale d'invitation */
  async openInviteModal() {
    await this.inviteButton.click();
    await expect(this.modal).toBeVisible({ timeout: 10000 });
  }

  /** Remplit le formulaire d'invitation et soumet */
  async fillAndSubmitInvitation(email: string, role: CollectiviteRole) {
    await this.emailInput.fill(email);
    const roleLabels: Record<CollectiviteRole, string> = {
      lecture: 'Lecteur',
      edition: 'Éditeur',
      admin: 'Admin',
      edition_fiches_indicateurs: 'Contributeur',
    };
    await this.niveauDropdown.selectOption(roleLabels[role]);
    await this.submitButton.click();
    await expect(this.modal).toBeHidden();
  }

  /** Invite un membre (ouvre la modale, remplit, soumet) */
  async inviteMembre(email: string, role: CollectiviteRole = 'lecture') {
    await this.openInviteModal();
    await this.fillAndSubmitInvitation(email, role);
  }

  /** Vérifie que l'invitation apparaît dans la liste (nouvel utilisateur) */
  async expectInvitationVisible(email: string) {
    await expect(
      this.page.locator(`[data-test="InvitationRow-${email}"]`)
    ).toBeVisible();
  }

  /** Vérifie que le membre apparaît dans la liste (utilisateur existant rattaché) */
  async expectMembreVisible(email: string) {
    await expect(
      this.page.locator(`[data-test="MembreRow-${email}"]`)
    ).toBeVisible();
  }
}
