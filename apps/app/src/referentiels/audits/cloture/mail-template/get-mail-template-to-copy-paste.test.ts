import { describe, expect, it } from 'vitest';
import { appLabels } from '../../../../labels/catalog';
import { getMailTemplateToCopyPaste } from './get-mail-template-to-copy-paste';

describe('getMailTemplateToCopyPaste', () => {
  const baseInput = {
    referentielNom: 'Climat Air Énergie',
    collectiviteNom: 'Ville de Lyon',
  };

  it('renvoie le template "sans labellisation" quand demandeId est null', () => {
    const result = getMailTemplateToCopyPaste({ ...baseInput, demandeId: null });
    expect(result.typeAuditLabel).toBe(appLabels.typeAuditSansLabellisation);
    expect(result.subject).toBe(
      appLabels.mailClotureAuditObjet({
        typeAudit: appLabels.typeAuditSansLabellisation,
        referentielNom: 'Climat Air Énergie',
        collectiviteNom: 'Ville de Lyon',
      })
    );
    expect(result.body).toBe(
      appLabels.mailClotureAuditContenu({
        typeAudit: appLabels.typeAuditSansLabellisation,
        referentielNom: 'Climat Air Énergie',
        collectiviteNom: 'Ville de Lyon',
      })
    );
  });

  it('renvoie le template "de labellisation" quand demandeId est non-null', () => {
    const result = getMailTemplateToCopyPaste({ ...baseInput, demandeId: 42 });
    expect(result.typeAuditLabel).toBe(appLabels.typeAuditDeLabellisation);
    expect(result.subject).toBe(
      appLabels.mailClotureAuditObjet({
        typeAudit: appLabels.typeAuditDeLabellisation,
        referentielNom: 'Climat Air Énergie',
        collectiviteNom: 'Ville de Lyon',
      })
    );
    expect(result.body).toBe(
      appLabels.mailClotureAuditContenu({
        typeAudit: appLabels.typeAuditDeLabellisation,
        referentielNom: 'Climat Air Énergie',
        collectiviteNom: 'Ville de Lyon',
      })
    );
  });

  it('contient le lien forms.office.com dans le contenu (invariant supply-chain)', () => {
    const { body } = getMailTemplateToCopyPaste({ ...baseInput, demandeId: null });
    expect(body).toContain('https://forms.office.com/e/');
  });

  it('reflète tel quel un collectiviteNom hostile (le template est utilisé en texte brut)', () => {
    const hostile = '<script>alert(1)</script>\r\n"evil"';
    const { subject, body } = getMailTemplateToCopyPaste({
      ...baseInput,
      demandeId: null,
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
