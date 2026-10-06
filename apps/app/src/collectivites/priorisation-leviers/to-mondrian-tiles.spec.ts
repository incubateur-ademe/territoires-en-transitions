import { describe, expect, it } from 'vitest';
import { NO_MOBILISATION } from './to-leviers-priorisation';
import { LevierPlace } from './to-matrix-points';
import { toMondrianTiles } from './to-mondrian-tiles';

const toPlace = (
  overrides: Partial<LevierPlace> & Pick<LevierPlace, 'levierId'>
): LevierPlace => ({
  nom: 'Production industrielle',
  secteur: 'Industrie',
  ficheCount: 0,
  mobilisationScore: 0,
  noteByCategorie: NO_MOBILISATION,
  potentielReduction: 10,
  potentielScore: 90,
  ...overrides,
});

describe('toMondrianTiles', () => {
  it('découpe le potentiel du levier selon la part de chaque catégorie et écarte les catégories sans part', () => {
    const [tile] = toMondrianTiles([
      toPlace({
        levierId: 'production_industrielle',
        potentielReduction: 20,
        noteByCategorie: { ...NO_MOBILISATION, financement: 2 },
      }),
    ]);

    expect(tile).toEqual({
      levierId: 'production_industrielle',
      nom: 'Production industrielle',
      potentielReduction: 20,
      categories: [
        { categorie: 'financement', potentielReduction: 10, note: 2 },
        { categorie: 'gouvernance', potentielReduction: 8, note: 0 },
        { categorie: 'sensibilisation', potentielReduction: 2, note: 0 },
      ],
    });
  });

  it('écarte les leviers dont le potentiel de réduction est nul', () => {
    const tiles = toMondrianTiles([
      toPlace({ levierId: 'covoiturage', potentielReduction: 0 }),
      toPlace({ levierId: 'biogaz', potentielReduction: 3 }),
    ]);

    expect(tiles.map(({ levierId }) => levierId)).toEqual(['biogaz']);
  });

  it('garde la pertinence du levier pour le distinguer quand il est non pertinent', () => {
    const [tile] = toMondrianTiles([
      toPlace({ levierId: 'biogaz', pertinence: 'non_pertinent' }),
    ]);

    expect(tile.pertinence).toBe('non_pertinent');
  });
});
