import { describe, expect, it } from 'vitest';
import {
  areIndicateurVueFiltersEqual,
  normalizeIndicateurVueFilters,
} from './indicateur-vue-filters.rules';

describe('indicateur vue filters from list state', () => {
  it('strips extra fields before normalizing supported criteria', () => {
    const filters = {
      planIds: [2, 1, 2],
      estFavori: false,
      text: '  Eau  ',
      currentPage: 3,
      unknownCriterion: true,
    };

    expect(normalizeIndicateurVueFilters(filters)).toEqual({
      planIds: [1, 2],
      estFavori: false,
      text: '  Eau  ',
    });
  });

  it('ignores extra fields on either side when comparing list criteria', () => {
    const first = { planIds: [2, 1, 2], currentPage: 3 };
    const second = { planIds: [1, 2], unknownCriterion: true };

    expect(areIndicateurVueFiltersEqual(first, second)).toBe(true);
  });

  it('still rejects malformed supported criteria', () => {
    const filters = { planIds: [1.5], unknownCriterion: true };

    expect(() => normalizeIndicateurVueFilters(filters)).toThrow();
    expect(() => areIndicateurVueFiltersEqual(filters, {})).toThrow();
    expect(() => areIndicateurVueFiltersEqual({}, filters)).toThrow();
  });
});
