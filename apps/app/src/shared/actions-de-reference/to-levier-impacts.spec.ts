import { describe, expect, it } from 'vitest';
import { toLevierImpacts } from './to-levier-impacts';

const PLACES = [
  { levierId: 'covoiturage', potentielReduction: 7 },
  { levierId: 'biogaz', potentielReduction: 93 },
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
        places: [{ levierId: 'covoiturage', potentielReduction: 0 }],
        levierIds: ['covoiturage'],
      })
    ).toEqual([]);
  });
});
