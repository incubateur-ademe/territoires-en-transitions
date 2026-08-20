import { describe, expect, it } from 'vitest';
import { appLabels } from './catalog';

describe('aideUploadFichier', () => {
  it('accorde « Format supporté » au singulier', () => {
    // Le cas des démarches PCAET : le modèle n'autorise que le PDF.
    expect(
      appLabels.aideUploadFichier({ tailleMaxMo: 10, formats: ['pdf'] })
    ).toBe('Taille maximale par fichier : 10 Mo. Format supporté : pdf.');
  });

  it('accorde « Formats supportés » au pluriel', () => {
    expect(
      appLabels.aideUploadFichier({
        tailleMaxMo: 10,
        formats: ['pdf', 'docx'],
      })
    ).toBe(
      'Taille maximale par fichier : 10 Mo. Formats supportés : pdf, docx.'
    );
  });
});
