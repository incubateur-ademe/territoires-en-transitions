import { describe, expect, it } from 'vitest';
import {
  areIndicateurVueFiltersEqual,
  normalizeIndicateurVueFilters,
} from './indicateur-vue-filters.rules';
import {
  IndicateurVueFilters,
  indicateurVueFiltersSchema,
} from './indicateur-vue-filters.schema';

describe('indicateur vue filters', () => {
  it('matches reordered criteria and selections with duplicates', () => {
    expect(
      areIndicateurVueFiltersEqual(
        {
          text: 'Énergie',
          indicateurIds: [10, 2, 10],
          identifiantsReferentiel: ['cae_2', 'cae_1', 'cae_2'],
        },
        {
          identifiantsReferentiel: ['cae_1', 'cae_2'],
          indicateurIds: [2, 10],
          text: 'Énergie',
        }
      )
    ).toBe(true);
  });

  it.each([
    'indicateurIds',
    'ficheIds',
    'identifiantsReferentiel',
    'thematiqueIds',
    'utilisateurPiloteIds',
    'personnePiloteIds',
    'serviceIds',
    'planIds',
    'axeIds',
    'categorieNoms',
  ] as const)('ignores empty %s as the list engine does', (key) => {
    expect(areIndicateurVueFiltersEqual({ [key]: [] }, {})).toBe(true);
  });

  it('ignores undefined criteria', () => {
    expect(
      areIndicateurVueFiltersEqual(
        { estFavori: undefined, text: undefined },
        {}
      )
    ).toBe(true);
  });

  it.each([
    'participationScore',
    'estRempli',
    'estConfidentiel',
    'estFavori',
    'isApplicable',
    'estPerso',
    'hasOpenData',
  ] as const)('distinguishes false, true and absent %s', (key) => {
    expect(areIndicateurVueFiltersEqual({ [key]: false }, {})).toBe(false);
    expect(
      areIndicateurVueFiltersEqual({ [key]: false }, { [key]: true })
    ).toBe(false);
  });

  it.each(['énergie', 'Energie', 'Énergie ', ' Énergie'])(
    'preserves the exact search text %j',
    (text) => {
      expect(areIndicateurVueFiltersEqual({ text: 'Énergie' }, { text })).toBe(
        false
      );
      expect(normalizeIndicateurVueFilters({ text })).toEqual({ text });
    }
  );

  it('ignores empty search but preserves whitespace used by the list engine', () => {
    expect(areIndicateurVueFiltersEqual({ text: '' }, {})).toBe(true);
    expect(normalizeIndicateurVueFilters({ text: '' })).toEqual({});
    expect(areIndicateurVueFiltersEqual({ text: ' ' }, {})).toBe(false);
  });

  it('distinguishes missing or additional selections', () => {
    expect(
      areIndicateurVueFiltersEqual({ planIds: [1] }, { planIds: [1, 2] })
    ).toBe(false);
    expect(
      areIndicateurVueFiltersEqual(
        { planIds: [1] },
        { planIds: [1], estFavori: true }
      )
    ).toBe(false);
  });

  it('preserves measure and children criteria', () => {
    expect(
      normalizeIndicateurVueFilters({ mesureId: '', withChildren: false })
    ).toEqual({ mesureId: '', withChildren: false });
    expect(areIndicateurVueFiltersEqual({ mesureId: '' }, {})).toBe(false);
    expect(areIndicateurVueFiltersEqual({ withChildren: true }, {})).toBe(
      false
    );
  });

  it('is idempotent, stable and does not mutate the input', () => {
    const filters: IndicateurVueFilters = {
      text: '  Eau potable  ',
      planIds: [10, 2, 10],
      estFavori: false,
      categorieNoms: ['z', 'a', 'z'],
      ficheIds: [],
    };
    const original = structuredClone(filters);
    const normalized = normalizeIndicateurVueFilters(filters);

    expect(normalized).toEqual({
      categorieNoms: ['a', 'z'],
      estFavori: false,
      planIds: [2, 10],
      text: '  Eau potable  ',
    });
    expect(Object.keys(normalized)).toEqual([
      'categorieNoms',
      'estFavori',
      'planIds',
      'text',
    ]);
    expect(normalizeIndicateurVueFilters(normalized)).toEqual(normalized);
    expect(filters).toEqual(original);
    expect(normalized.planIds).not.toBe(filters.planIds);
  });
});

describe('indicateur vue filters validation', () => {
  it('accepts an empty vue and all supported selection criteria', () => {
    expect(indicateurVueFiltersSchema.safeParse({}).success).toBe(true);
    const filters: Required<IndicateurVueFilters> = {
      indicateurIds: [1],
      ficheIds: [2],
      identifiantsReferentiel: ['cae_1'],
      thematiqueIds: [3],
      utilisateurPiloteIds: ['123e4567-e89b-42d3-a456-426614174000'],
      personnePiloteIds: [4],
      serviceIds: [5],
      planIds: [6],
      axeIds: [7],
      mesureId: 'cae_1.1.1',
      categorieNoms: ['Energie'],
      participationScore: false,
      estRempli: false,
      estConfidentiel: false,
      estFavori: false,
      isApplicable: false,
      estPerso: false,
      hasOpenData: false,
      withChildren: false,
      text: 'eau',
    };
    expect(indicateurVueFiltersSchema.parse(filters)).toEqual(filters);
  });

  it.each([
    { collectiviteId: 1 },
    { queryOptions: { page: 1 } },
    { page: 1 },
    { sort: ['titre'] },
    { futureCriterion: true },
    { planIds: ['1'] },
    { planIds: [1.5] },
    { utilisateurPiloteIds: ['invalid-uuid'] },
    { utilisateurPiloteIds: [''] },
    { estFavori: 'false' },
    { estFavori: null },
    { text: null },
    null,
  ])('rejects unsupported or invalid criteria %j', (filters) => {
    expect(indicateurVueFiltersSchema.safeParse(filters).success).toBe(false);
  });

  it('does not silently drop unknown criteria while normalizing or comparing', () => {
    const invalidFilters = { estFavori: true, unknownCriterion: [1] };
    expect(() => normalizeIndicateurVueFilters(invalidFilters)).toThrow();
    expect(() =>
      areIndicateurVueFiltersEqual(invalidFilters, { estFavori: true })
    ).toThrow();
  });
});
