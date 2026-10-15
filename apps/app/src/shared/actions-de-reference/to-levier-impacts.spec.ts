import { describe, expect, it } from 'vitest';
import { toLevierImpactLines, toLevierImpacts } from './to-levier-impacts';

const PLACES = [
  { levierId: 'covoiturage', potentielReduction: 7, impactIndex: 7 },
  { levierId: 'biogaz', potentielReduction: 93, impactIndex: 93 },
] as const;

describe('toLevierImpacts', () => {
  it("donne l'impact de chaque levier de l'action sur 100 du potentiel du territoire", () => {
    expect(
      toLevierImpacts({
        places: PLACES,
        levierIds: ['covoiturage', 'biogaz'],
      })
    ).toEqual([
      { levierId: 'covoiturage', levierNom: 'Covoiturage', score: 7 },
      { levierId: 'biogaz', levierNom: 'Biogaz', score: 93 },
    ]);
  });

  it('ignore un levier sans potentiel connu', () => {
    expect(
      toLevierImpacts({
        places: [PLACES[1]],
        levierIds: ['covoiturage'],
      })
    ).toEqual([]);
  });

  it("ne donne aucun impact quand le territoire n'a aucun potentiel", () => {
    expect(
      toLevierImpacts({
        places: [
          { levierId: 'covoiturage', potentielReduction: 0, impactIndex: 0 },
        ],
        levierIds: ['covoiturage'],
      })
    ).toEqual([]);
  });
});

describe('toLevierImpactLines', () => {
  const COVOITURAGE_IMPACT = {
    levierId: 'covoiturage',
    levierNom: 'Covoiturage',
    score: 7,
  } as const;

  it("n'ajoute pas le nom du levier quand l'action n'en porte qu'un", () => {
    expect(
      toLevierImpactLines({
        impacts: [COVOITURAGE_IMPACT],
        actionLevierCount: 1,
      })
    ).toEqual([
      { levierId: 'covoiturage', text: '7/100 du territoire (estimé)' },
    ]);
  });

  it("ajoute le nom du levier dès que l'action en porte plusieurs, même si un seul a un impact connu", () => {
    expect(
      toLevierImpactLines({
        impacts: [COVOITURAGE_IMPACT],
        actionLevierCount: 2,
      })
    ).toEqual([
      {
        levierId: 'covoiturage',
        text: 'Covoiturage : 7/100 du territoire (estimé)',
      },
    ]);
  });
});
