import { describe, expect, it } from 'vitest';
import { combineSearchSources, createSearchSource } from './search-source';

const departements = [
  { code: '34', libelle: 'Hérault' },
  { code: '70', libelle: 'Haute-Saône' },
  { code: '74', libelle: 'Haute-Savoie' },
];

const departementsSource = createSearchSource({
  id: 'departements',
  label: 'Départements',
  items: departements,
  getTexts: ({ code, libelle }) => [libelle, code],
  toOption: ({ code, libelle }) => ({
    id: code,
    label: `${libelle} (${code})`,
  }),
  limit: 1,
});

const surlignes = (label: string, ranges: readonly (readonly number[])[]) =>
  ranges.map(([start, end]) => label.slice(start, end));

describe('createSearchSource', () => {
  it('surligne le passage reconnu, même quand il n’est qu’une part du libellé', () => {
    const option = departementsSource('70')?.options[0];
    expect(option?.label).toBe('Haute-Saône (70)');
    expect(
      surlignes(option?.label ?? '', option?.highlightRanges ?? [])
    ).toEqual(['70']);
  });

  it('limite les options et annonce le total', () => {
    const group = departementsSource('haute');
    expect(group?.options).toHaveLength(1);
    expect(group?.totalCount).toBe(2);
  });

  it('signale une option reconnue à une faute de frappe près', () => {
    const option = departementsSource('herauld')?.options[0];
    expect(option).toMatchObject({ id: '34', isApproximate: true });
  });

  it('ne rend pas de groupe quand rien ne répond', () => {
    expect(departementsSource('zzzzzz')).toBeNull();
  });
});

describe('combineSearchSources', () => {
  it('assemble les groupes dans l’ordre, sans les sources écartées ni vides', () => {
    const getSuggestions = combineSearchSources([
      false,
      departementsSource,
      () => null,
    ]);
    expect(getSuggestions('haute').map(({ id }) => id)).toEqual([
      'departements',
    ]);
  });
});
