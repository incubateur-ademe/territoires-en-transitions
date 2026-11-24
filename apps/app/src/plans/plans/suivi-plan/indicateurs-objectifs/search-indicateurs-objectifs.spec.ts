import { describe, expect, it } from 'vitest';
import {
  buildSearchIndicateursSuggestions,
  filterIndicateursObjectifs,
} from './search-indicateurs-objectifs';

const indicateurs = [
  {
    id: 1,
    titre: 'Émissions de gaz à effet de serre',
    identifiantReferentiel: 'cae_1.a',
    favori: true,
    sources: ['reglementaire' as const, 'plan' as const],
  },
  {
    id: 2,
    titre: 'Consommation énergétique finale',
    identifiantReferentiel: 'cae_2.a',
    favori: false,
    sources: ['reglementaire' as const],
  },
  {
    id: 3,
    titre: 'Logements rénovés',
    identifiantReferentiel: null,
    favori: false,
    sources: ['plan' as const],
  },
];

describe('filterIndicateursObjectifs', () => {
  it('filtre par source : réglementaires, ou liés au plan', () => {
    const ids = (source: 'tous' | 'reglementaires' | 'plan') =>
      filterIndicateursObjectifs(indicateurs, {
        recherche: '',
        selectionIds: [],
        source,
      }).map(({ id }) => id);

    expect(ids('tous')).toEqual([1, 2, 3]);
    expect(ids('reglementaires')).toEqual([1, 2]);
    expect(ids('plan')).toEqual([1, 3]);
  });

  it('garde tout sans recherche ni étiquette', () => {
    expect(
      filterIndicateursObjectifs(indicateurs, {
        recherche: '',
        selectionIds: [],
      })
    ).toEqual(indicateurs);
  });

  it('cherche sans tenir compte des accents ni de la casse, ordre conservé', () => {
    expect(
      filterIndicateursObjectifs(indicateurs, {
        recherche: 'ENERGETIQUE',
        selectionIds: [],
      }).map(({ id }) => id)
    ).toEqual([2]);
  });

  it('tolère une faute de frappe à défaut de correspondance exacte', () => {
    expect(
      filterIndicateursObjectifs(indicateurs, {
        recherche: 'logemnts',
        selectionIds: [],
      }).map(({ id }) => id)
    ).toEqual([3]);
  });

  it('trouve un indicateur par son identifiant', () => {
    expect(
      filterIndicateursObjectifs(indicateurs, {
        recherche: 'cae_1.a',
        selectionIds: [],
      }).map(({ id }) => id)
    ).toEqual([1]);
  });

  it('ne garde que les indicateurs choisis en étiquette', () => {
    expect(
      filterIndicateursObjectifs(indicateurs, {
        recherche: '',
        selectionIds: [3, 1],
      }).map(({ id }) => id)
    ).toEqual([1, 3]);
  });
});

describe('buildSearchIndicateursSuggestions', () => {
  it('suggère les indicateurs qui répondent, favori signalé', () => {
    const [group] = buildSearchIndicateursSuggestions(indicateurs)('emission');

    expect(group?.options).toEqual([
      expect.objectContaining({ id: '1', badge: 'Favori' }),
    ]);
  });
});
