import { describe, expect, it } from 'vitest';
import {
  formatModuleFiltersToCategories,
  isIndicateurModuleFilters,
} from './format-module-filters-to-categories';

describe('formatModuleFiltersToCategories', () => {
  it('formats action-shaped mesures filters including referentielIds', () => {
    const categories = formatModuleFiltersToCategories({
      referentielIds: ['cae', 'eci'],
      utilisateurPiloteIds: ['user-1'],
      actionTypes: ['action'],
    });

    expect(categories).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'referentielIds',
          selectedFilters: expect.arrayContaining([
            'Climat Air Énergie',
            'Économie Circulaire',
          ]),
          readonly: true,
        }),
        expect.objectContaining({
          key: 'pilotes',
          selectedFilters: ['user-1'],
        }),
      ])
    );
  });

  it('returns null for fiche filters so they are not treated as action filters', () => {
    const categories = formatModuleFiltersToCategories({
      planActionIds: [1],
      utilisateurPiloteIds: ['user-1'],
    });

    expect(categories).toBeNull();
  });
});

describe('isIndicateurModuleFilters', () => {
  it('does not treat withChildren alone as indicateur filters (shared with fiches)', () => {
    expect(isIndicateurModuleFilters({ withChildren: true })).toBe(false);
  });

  it('still recognizes indicateur-specific filters', () => {
    expect(isIndicateurModuleFilters({ estFavori: true })).toBe(true);
    expect(isIndicateurModuleFilters({ categorieNoms: ['cae'] })).toBe(true);
  });
});
