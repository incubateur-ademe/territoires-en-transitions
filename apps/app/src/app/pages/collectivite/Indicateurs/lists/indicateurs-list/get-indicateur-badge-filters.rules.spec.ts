import type { ListDefinitionsInputFilters } from '@/app/indicateurs/indicateurs/use-list-indicateurs';
import { describe, expect, it } from 'vitest';
import { getIndicateurBadgeFilters } from './get-indicateur-badge-filters.rules';

describe('getIndicateurBadgeFilters', () => {
  it('keeps all saved-view criteria when there are no fixed-tab defaults', () => {
    const filters = {
      text: 'Mobilité',
      estFavori: true,
      estRempli: false,
      planIds: [2, 1],
    };

    expect(getIndicateurBadgeFilters(filters)).toEqual(filters);
  });

  it.each<{
    name: string;
    filters: ListDefinitionsInputFilters;
    defaultFilters: ListDefinitionsInputFilters;
    expected: ListDefinitionsInputFilters;
  }>([
    {
      name: 'hides unchanged fixed-tab criteria',
      filters: { text: 'Mobilité', estRempli: false, planIds: [1, 2] },
      defaultFilters: { text: 'Mobilité', estRempli: false, planIds: [1, 2] },
      expected: {},
    },
    {
      name: 'keeps a changed search even when its key is a fixed-tab default',
      filters: { text: 'Eau' },
      defaultFilters: { text: 'Mobilité' },
      expected: { text: 'Eau' },
    },
    {
      name: 'keeps changed selections and new criteria, hiding unchanged ones',
      filters: { text: 'Mobilité', planIds: [2, 3], estFavori: true },
      defaultFilters: { text: 'Mobilité', planIds: [1, 2] },
      expected: { planIds: [2, 3], estFavori: true },
    },
    {
      name: 'ignores selection order and duplicates',
      filters: { planIds: [2, 1, 2], categorieNoms: ['eci', 'cae'] },
      defaultFilters: { planIds: [1, 2], categorieNoms: ['cae', 'eci', 'cae'] },
      expected: {},
    },
    {
      name: 'keeps false when the default value is true',
      filters: { estRempli: false },
      defaultFilters: { estRempli: true },
      expected: { estRempli: false },
    },
    {
      name: 'does not restore default criteria that were temporarily cleared',
      filters: {},
      defaultFilters: { text: 'Mobilité', estFavori: true },
      expected: {},
    },
  ])('$name', ({ filters, defaultFilters, expected }) => {
    expect(getIndicateurBadgeFilters(filters, defaultFilters)).toEqual(
      expected
    );
  });
});
