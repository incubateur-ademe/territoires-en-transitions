import { describe, expect, it } from 'vitest';
import { toLevierSubtitle } from './to-levier-subtitle';

describe('toLevierSubtitle', () => {
  it("ajoute l'impact potentiel estimé au secteur quand le levier a un potentiel", () => {
    expect(toLevierSubtitle({ secteur: 'Bâtiment', impactIndex: 19 })).toBe(
      'Bâtiment · Impact potentiel estimé : 19/100'
    );
  });

  it("n'affiche que le secteur quand le levier n'a pas de potentiel", () => {
    expect(toLevierSubtitle({ secteur: 'Bâtiment' })).toBe('Bâtiment');
  });
});
