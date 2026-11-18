import { describe, expect, it } from 'vitest';
import { toFicheAxePaths } from './list-fiche-axe-paths.rules';

const ancestryByAxeId = {
  10: [{ nom: 'PCAET 2024-2030' }],
  11: [{ nom: 'PCAET 2024-2030' }, { nom: 'Mobilité' }],
  12: [
    { nom: 'PCAET 2024-2030' },
    { nom: 'Mobilité' },
    { nom: 'Mobilités douces' },
  ],
  20: [{ nom: 'PCAET 2024-2030' }, { nom: null }],
};

describe('toFicheAxePaths', () => {
  it('rend le chemin du plan jusqu’à l’axe de la fiche', () => {
    expect(
      toFicheAxePaths({
        ficheIds: [1],
        links: [{ ficheId: 1, axeId: 12 }],
        ancestryByAxeId,
      })
    ).toEqual([
      {
        ficheId: 1,
        axePaths: [['PCAET 2024-2030', 'Mobilité', 'Mobilités douces']],
      },
    ]);
  });

  it('rend une liste vide pour une fiche sans axe', () => {
    expect(
      toFicheAxePaths({ ficheIds: [1], links: [], ancestryByAxeId })
    ).toEqual([{ ficheId: 1, axePaths: [] }]);
  });

  it('trie les chemins d’une fiche rattachée à plusieurs axes', () => {
    expect(
      toFicheAxePaths({
        ficheIds: [1],
        links: [
          { ficheId: 1, axeId: 12 },
          { ficheId: 1, axeId: 11 },
        ],
        ancestryByAxeId,
      })[0].axePaths
    ).toEqual([
      ['PCAET 2024-2030', 'Mobilité'],
      ['PCAET 2024-2030', 'Mobilité', 'Mobilités douces'],
    ]);
  });

  it('dédoublonne deux axes de même chemin', () => {
    expect(
      toFicheAxePaths({
        ficheIds: [1],
        links: [
          { ficheId: 1, axeId: 11 },
          { ficheId: 1, axeId: 11 },
        ],
        ancestryByAxeId,
      })[0].axePaths
    ).toEqual([['PCAET 2024-2030', 'Mobilité']]);
  });

  it('remplace le nom absent d’un axe par une chaîne vide', () => {
    expect(
      toFicheAxePaths({
        ficheIds: [1],
        links: [{ ficheId: 1, axeId: 20 }],
        ancestryByAxeId,
      })[0].axePaths
    ).toEqual([['PCAET 2024-2030', '']]);
  });

  it('écarte un axe dont le chemin est introuvable', () => {
    expect(
      toFicheAxePaths({
        ficheIds: [1],
        links: [{ ficheId: 1, axeId: 999 }],
        ancestryByAxeId,
      })
    ).toEqual([{ ficheId: 1, axePaths: [] }]);
  });

  it('distingue un axe nommé « A > B » du chemin A puis B', () => {
    expect(
      toFicheAxePaths({
        ficheIds: [1],
        links: [
          { ficheId: 1, axeId: 30 },
          { ficheId: 1, axeId: 31 },
        ],
        ancestryByAxeId: {
          30: [{ nom: 'A > B' }],
          31: [{ nom: 'A' }, { nom: 'B' }],
        },
      })[0].axePaths
    ).toEqual([['A', 'B'], ['A > B']]);
  });

  it('rend une seule entrée pour un identifiant de fiche demandé deux fois', () => {
    expect(
      toFicheAxePaths({ ficheIds: [1, 1], links: [], ancestryByAxeId })
    ).toEqual([{ ficheId: 1, axePaths: [] }]);
  });

  it('range les chemins sous la bonne fiche', () => {
    expect(
      toFicheAxePaths({
        ficheIds: [1, 2],
        links: [
          { ficheId: 2, axeId: 10 },
          { ficheId: 1, axeId: 11 },
        ],
        ancestryByAxeId,
      })
    ).toEqual([
      { ficheId: 1, axePaths: [['PCAET 2024-2030', 'Mobilité']] },
      { ficheId: 2, axePaths: [['PCAET 2024-2030']] },
    ]);
  });
});
