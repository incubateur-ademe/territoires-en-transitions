import { expect, Locator, Page } from '@playwright/test';
import { ReferentielId } from '@tet/domain/referentiels';
import { DocumentsPom } from 'tests/collectivite/documents/documents.pom';

export type RoleKey = 'eluReferent' | 'referentTechnique';

/** Libellé visible du rôle dans le header (champ vide → forme au singulier) */
const ROLE_LABEL: Record<RoleKey, string> = {
  eluReferent: 'Élu·e référent·e',
  referentTechnique: 'Référent·e technique',
};

export class NewAuditLabellisationPom {
  readonly title: Locator;
  readonly demanderPremiereEtoileButton: Locator;
  readonly televerserActeSigneButton: Locator;
  readonly remplacerFichierButton: Locator;
  readonly acteUploadModalTitle: Locator;
  readonly envoyerDemandeButton: Locator;
  readonly successMessage: Locator;
  readonly enregistrementErrorToast: Locator;
  readonly scoreMinimumRow: Locator;
  readonly roleSearchInput: Locator;
  readonly candidatureDocumentsTitle: Locator;
  readonly ajouterDocumentButton: Locator;
  readonly demanderAuditButton: Locator;
  readonly auditModal: Locator;
  readonly auditTypeGroup: Locator;
  readonly auditTypeCotRadio: Locator;
  readonly auditTypeCotAvecLabellisationRadio: Locator;
  readonly targetStarSelect: Locator;
  readonly envoyerAuditButton: Locator;
  readonly auditSuccessToast: Locator;
  readonly documentsPom: DocumentsPom;

  constructor(readonly page: Page) {
    this.documentsPom = new DocumentsPom(page);
    this.title = page.getByRole('heading', {
      name: 'Demander un audit ou une labellisation',
    });
    this.demanderPremiereEtoileButton = page.getByRole('button', {
      name: 'Obtenir la première étoile',
    });
    this.televerserActeSigneButton = page.getByRole('button', {
      name: "Téléverser l'acte signé",
    });
    this.remplacerFichierButton = page.getByRole('button', {
      name: 'Remplacer le fichier',
    });
    this.acteUploadModalTitle = page.getByRole('heading', {
      name: "Téléverser l'acte d'engagement signé",
    });
    this.envoyerDemandeButton = page.getByRole('button', {
      name: 'Envoyer ma demande',
    });
    this.successMessage = page.getByText(
      'Votre demande de labellisation a bien été envoyée'
    );
    this.enregistrementErrorToast = page.getByText(
      "Erreur lors de l'enregistrement"
    );
    this.scoreMinimumRow = page.getByRole('row', {
      name: /Atteindre un score réalisé/,
    });
    this.roleSearchInput = page.getByPlaceholder('Rechercher par mots-clés');
    this.candidatureDocumentsTitle = page.getByText(
      'Documents officiels de candidature'
    );
    this.ajouterDocumentButton = page.getByRole('button', {
      name: 'Ajouter un document',
    });
    this.demanderAuditButton = page.getByRole('button', {
      name: 'Demander un audit',
    });
    this.auditModal = page.getByRole('dialog', { name: 'Demander un audit' });
    this.auditTypeGroup = page.getByRole('group', {
      name: "Quel type d'audit souhaitez-vous demander ?",
    });
    this.auditTypeCotRadio = this.auditModal.getByRole('radio', {
      name: 'Audit COT sans labellisation',
    });
    this.auditTypeCotAvecLabellisationRadio = this.auditModal.getByRole(
      'radio',
      { name: 'Audit COT avec labellisation' }
    );
    this.targetStarSelect = this.auditModal.getByTestId('target-star');
    this.envoyerAuditButton = this.auditModal.getByRole('button', {
      name: 'Envoyer ma demande',
    });
    this.auditSuccessToast = page.getByText(
      "Votre demande d'audit a bien été envoyée."
    );
  }

  /**
   * Champ éditable du rôle dans le header, ciblé par son libellé suivi de
   * « : » — ce qui le distingue des formulations de mesures du tableau qui
   * contiennent aussi le libellé du rôle.
   */
  roleHeaderItem(role: RoleKey): Locator {
    return this.page.getByText(`${ROLE_LABEL[role]} :`);
  }

  roleDropdownOption(name: string): Locator {
    return this.page
      .getByTestId('personnes-options')
      .getByRole('button', { name });
  }

  /** Ligne du tableau checklist pour une mesure, identifiée par une formulation partielle */
  checklistRow(formulationPattern: string | RegExp): Locator {
    return this.page.getByRole('row', { name: formulationPattern });
  }

  /**
   * Bouton « Créer » d'un tag libre, affiché dans le dropdown rôle une fois
   * un nom absent de la liste saisi.
   */
  createTagButton(tagName: string): Locator {
    return this.page.getByRole('button', { name: new RegExp(tagName) });
  }

  async goto(
    collectiviteId: number,
    referentielId: ReferentielId
  ): Promise<void> {
    await this.page.goto(
      `/collectivite/${collectiviteId}/referentiel/new/${referentielId}/audit-labellisation`
    );
    await expect(this.title).toBeVisible({ timeout: 15_000 });
  }

  async uploadActeEngagement(): Promise<void> {
    await this.televerserActeSigneButton.click();
    await this.documentsPom.setTestDocument();
  }

  async uploadCandidatureDocument(): Promise<void> {
    await this.ajouterDocumentButton.click();
    await this.documentsPom.setTestDocument();
  }

  /** Ouvre la modale « Demander un audit » depuis l'en-tête de la checklist */
  async openAuditModal(): Promise<void> {
    await this.demanderAuditButton.click();
    await expect(this.auditModal).toBeVisible();
  }

  async selectTargetStar(star: 2 | 3 | 4 | 5): Promise<void> {
    await this.targetStarSelect.click();
    await this.auditModal.getByTestId(String(star)).click();
  }
}
