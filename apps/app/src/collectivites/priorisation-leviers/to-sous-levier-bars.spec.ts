import { describe, expect, it } from 'vitest';
import { NO_MOBILISATION } from './to-leviers-priorisation';
import { LevierPlace } from './to-matrix-points';
import { toSousLevierBars } from './to-sous-levier-bars';

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

describe('toSousLevierBars', () => {
  it('fait une barre par catégorie du levier, nommée levier · catégorie et colorée par sa mobilisation', () => {
    const bars = toSousLevierBars([
      toPlace({
        levierId: 'production_industrielle',
        potentielReduction: 20,
        noteByCategorie: { ...NO_MOBILISATION, financement: 2 },
      }),
    ]);

    expect(bars).toEqual([
      {
        id: 'production_industrielle/financement',
        label: 'Production industrielle · Financement & fiscalité',
        value: 10,
        status: 'Bien mobilisé',
        levierId: 'production_industrielle',
      },
      {
        id: 'production_industrielle/gouvernance',
        label: 'Production industrielle · Gouvernance & partenariats',
        value: 8,
        status: 'Non mobilisé',
        levierId: 'production_industrielle',
      },
      {
        id: 'production_industrielle/sensibilisation',
        label: 'Production industrielle · Sensibilisation & accompagnement',
        value: 2,
        status: 'Non mobilisé',
        levierId: 'production_industrielle',
      },
    ]);
  });

  it('trie les sous-leviers de tous les leviers par potentiel décroissant', () => {
    const bars = toSousLevierBars([
      toPlace({ levierId: 'production_industrielle', potentielReduction: 20 }),
      toPlace({
        levierId: 'covoiturage',
        nom: 'Covoiturage',
        potentielReduction: 100,
      }),
    ]);

    const values = bars.map(({ value }) => value);
    expect(values).toEqual([...values].sort((first, second) => second - first));
    expect(bars[0].levierId).toBe('covoiturage');
  });

  it('écarte les leviers sans potentiel de réduction', () => {
    const bars = toSousLevierBars([
      toPlace({ levierId: 'covoiturage', potentielReduction: 0 }),
    ]);

    expect(bars).toEqual([]);
  });
});
