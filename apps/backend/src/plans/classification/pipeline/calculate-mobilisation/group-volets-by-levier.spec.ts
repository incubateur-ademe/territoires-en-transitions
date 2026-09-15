import { describe, expect, it } from 'vitest';
import { groupVoletsByLevier } from './group-volets-by-levier';

describe('groupVoletsByLevier', () => {
  it('rend les six catégories pour un levier, même celles sans fiche', () => {
    const [levier] = groupVoletsByLevier([
      {
        ficheId: 1,
        levierId: 'velo_transport_commun',
        categorie: 'amenagement',
      },
    ]);

    expect(levier.ficheIdsByCategorie).toEqual({
      amenagement: [1],
      planification: [],
      financement: [],
      gouvernance: [],
      exemplarite: [],
      sensibilisation: [],
    });
  });

  it('regroupe une même fiche sous plusieurs leviers', () => {
    const groupedLeviers = groupVoletsByLevier([
      {
        ficheId: 1,
        levierId: 'velo_transport_commun',
        categorie: 'amenagement',
      },
      { ficheId: 1, levierId: 'covoiturage', categorie: 'amenagement' },
    ]);

    expect(
      groupedLeviers.map(({ levierId, ficheIdsByCategorie }) => ({
        levierId,
        amenagement: ficheIdsByCategorie.amenagement,
      }))
    ).toEqual([
      { levierId: 'velo_transport_commun', amenagement: [1] },
      { levierId: 'covoiturage', amenagement: [1] },
    ]);
  });

  it('dédoublonne et ordonne les identifiants de fiches', () => {
    const [levier] = groupVoletsByLevier([
      {
        ficheId: 7,
        levierId: 'velo_transport_commun',
        categorie: 'gouvernance',
      },
      {
        ficheId: 2,
        levierId: 'velo_transport_commun',
        categorie: 'gouvernance',
      },
      {
        ficheId: 7,
        levierId: 'velo_transport_commun',
        categorie: 'gouvernance',
      },
    ]);

    expect(levier.ficheIdsByCategorie.gouvernance).toEqual([2, 7]);
  });
});
