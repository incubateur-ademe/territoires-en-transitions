import { IndicateurAvecValeursParSource } from '@tet/domain/indicateurs';
import {
  groupIndicateursByOrderedSegmentation,
  selectBestIndicateurSourceValeurType,
} from './indicateur-chart-segmentation.rules';

describe('indicateur chart segmentation rules', () => {
  test('ordonne les segmentations et applique la segmentation par défaut', () => {
    const result = groupIndicateursByOrderedSegmentation([
      { id: 1, categories: [{ nom: 'vecteur' }] },
      { id: 2, categories: [] },
    ] as never);

    expect(result.orderedAvailableSegmentations).toEqual(['vecteur', 'autre']);
    expect(result.indicateursBySegmentation).toEqual({
      vecteur: [1],
      autre: [2],
    });
  });

  test('choisit uniquement les valeurs effectivement renseignées', () => {
    const result = selectBestIndicateurSourceValeurType([
      {
        sources: {
          sourceVide: {
            valeurs: [
              { dateValeur: '2026-01-01', resultat: null, objectif: null },
              { dateValeur: '2027-01-01', resultat: null, objectif: null },
            ],
          },
          sourceRenseignee: {
            valeurs: [{ dateValeur: '2026-01-01', resultat: 42 }],
          },
        },
      } as unknown as IndicateurAvecValeursParSource,
    ]);

    expect(result).toEqual({
      source: 'sourceRenseignee',
      valeurType: 'resultat',
    });
  });

  test("tolère l'absence de la source demandée sur un indicateur enfant", () => {
    const result = selectBestIndicateurSourceValeurType(
      [
        { sources: {} },
        {
          sources: {
            insee: {
              valeurs: [{ dateValeur: '2026-01-01', objectif: 12 }],
            },
          },
        },
      ] as unknown as IndicateurAvecValeursParSource[],
      'insee',
      'objectif'
    );

    expect(result).toMatchObject({ source: 'insee', valeurType: 'objectif' });
  });
});
