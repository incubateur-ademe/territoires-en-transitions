import { describe, expect, it } from 'vitest';
import {
  buildSearchIndicateursSuggestions,
  buildSearchSuggestions,
  filterIndicateursObjectifs,
  parseSuggestionFiltre,
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

describe('buildSearchSuggestions', () => {
  const sources = {
    indicateurs: [],
    axes: [{ id: 7, nom: 'Mobilités' }],
    pilotes: [{ id: 'u-1', nom: 'Marie Durand' }],
    services: [{ id: '3', nom: 'Énergie' }],
    thematiques: [{ id: '5', nom: 'Bâtiment' }],
  };
  const optionsPour = (query: string) =>
    buildSearchSuggestions(sources)(query).flatMap((group) =>
      group.options.map((option) => option.id)
    );

  it('propose chaque critère de filtre avec son préfixe', () => {
    expect(optionsPour('mobil')).toEqual(['axe:7']);
    expect(optionsPour('durand')).toEqual(['pilote:u-1']);
    expect(optionsPour('énergie')).toEqual(['service:3']);
    expect(optionsPour('bâtiment')).toEqual(['thematique:5']);
  });

  it('lit le préfixe et la valeur d’une suggestion de filtre', () => {
    expect(parseSuggestionFiltre('axe:7')).toEqual({
      prefixe: 'axe',
      valeur: '7',
    });
    expect(parseSuggestionFiltre('12')).toBeNull();
  });
});
