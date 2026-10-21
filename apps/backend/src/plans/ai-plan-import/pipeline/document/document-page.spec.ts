import { describe, expect, it } from 'vitest';
import { buildDocument, buildPage, joinPages } from './document-page';

describe('joinPages', () => {
  it("annonce chaque onglet d'un classeur, et saute les pages vides", () => {
    const document = buildDocument('xlsx', [
      buildPage(0, [{ text: 'Titre\tPilote' }], { label: 'Suivi' }),
      buildPage(1, [], { label: 'Vide' }),
      buildPage(2, [{ text: 'Statuts' }], { label: 'Feuil2' }),
    ]);

    expect(joinPages(document)).toBe(
      '[Onglet « Suivi »]\nTitre\tPilote\n[Onglet « Feuil2 »]\nStatuts'
    );
  });

  it("n'annonce pas les sections titrées d'un Word", () => {
    const document = buildDocument('docx', [
      buildPage(0, [{ text: '# Axe 1' }], { label: 'Axe 1' }),
    ]);

    expect(joinPages(document)).toBe('# Axe 1');
  });
});
