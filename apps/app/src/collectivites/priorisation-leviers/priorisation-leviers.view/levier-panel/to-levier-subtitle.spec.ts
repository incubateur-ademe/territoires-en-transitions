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

  it.each([
    ['pertinent', 'Bâtiment · Impact potentiel estimé : 19/100 · Pertinent'],
    [
      'non_pertinent',
      'Bâtiment · Impact potentiel estimé : 19/100 · Non pertinent',
    ],
  ] as const)(
    'termine par la pertinence quand le levier est marqué %s',
    (pertinence, subtitle) => {
      expect(
        toLevierSubtitle({ secteur: 'Bâtiment', impactIndex: 19, pertinence })
      ).toBe(subtitle);
    }
  );

  it("ajoute la pertinence au secteur quand le levier n'a pas de potentiel", () => {
    expect(
      toLevierSubtitle({ secteur: 'Bâtiment', pertinence: 'non_pertinent' })
    ).toBe('Bâtiment · Non pertinent');
  });
});
