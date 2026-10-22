import { describe, expect, it } from 'vitest';
import { getMailTemplateToCopyPaste } from './get-mail-template-to-copy-paste';

describe('getMailTemplateToCopyPaste', () => {
  const baseInput = {
    referentielNom: 'Climat Air Énergie',
    collectiviteNom: 'Ville de Lyon',
  };

  it("laisse l'auditeur préciser la nature de l'audit dans l'objet", () => {
    expect(getMailTemplateToCopyPaste(baseInput).subject).toBe(
      'Ville de Lyon / Achèvement Audit (à préciser COT/Label, CAE/ECi)'
    );
  });

  it("annonce la fin de l'audit avec le nom du référentiel, le lien de l'app et le questionnaire", () => {
    expect(getMailTemplateToCopyPaste(baseInput).body).toBe(
      "Bonjour,\n\nL'audit Climat Air Énergie de Ville de Lyon est terminé.\n\nVous trouverez le rapport d'audit sur la plateforme Territoires en Transitions (https://app.territoiresentransitions.fr). Dans un souci d'amélioration continue de nos pratiques d'audit, merci de bien vouloir renseigner le questionnaire ci-joint : https://forms.office.com/e/29txbS6kRX?origin=lprLink\n\nJe me tiens à votre disposition pour tout élément complémentaire.\n\nEn vous remerciant encore pour la qualité des échanges et en vous félicitant pour votre implication dans la démarche TETE.\n\nBonne continuation dans la démarche et à bientôt,\n\nCordialement,"
    );
  });

  it('contient le lien forms.office.com dans le contenu (invariant supply-chain)', () => {
    const { body } = getMailTemplateToCopyPaste(baseInput);
    expect(body).toContain('https://forms.office.com/e/');
  });

  it('reflète tel quel un collectiviteNom hostile (le template est utilisé en texte brut)', () => {
    const hostile = '<script>alert(1)</script>\r\n"evil"';
    const { subject, body } = getMailTemplateToCopyPaste({
      ...baseInput,
      collectiviteNom: hostile,
    });
    // L'invariant : le rendu se fait dans un <textarea readOnly>, donc on ne
    // doit pas échapper, mais on ne doit pas non plus tronquer / réécrire.
    // Toute consommation HTML / mailto: ailleurs doit traiter ce champ comme
    // user-controlled.
    expect(subject).toContain(hostile);
    expect(body).toContain(hostile);
  });
});
