import {
  CollectivitePopulationTypeEnum,
  CollectiviteSousTypeEnum,
  CollectiviteTypeEnum,
  IdentiteCollectivite,
} from '@tet/domain/collectivites';
import {
  evaluateIdentite,
  IDENTITE_ALLOWED_VALUES,
  IdentiteField,
} from './evaluate-identite';

const ALL_POPULATION_TAGS = Object.values(CollectivitePopulationTypeEnum);

const IDENTITE_COMPLETE: IdentiteCollectivite = {
  type: CollectiviteTypeEnum.EPCI,
  soustype: CollectiviteSousTypeEnum.SYNDICAT,
  populationTags: ALL_POPULATION_TAGS,
  drom: true,
  dansAireUrbaine: true,
  communesMembresPopulationTags: ALL_POPULATION_TAGS,
  sinoeId: 'urbain',
};

/**
 * Le lexer lit `oui`/`non` sans tenir compte de la casse et la règle `primary`
 * les rend en booléens : ils n'arrivent jamais en chaîne à l'évaluation.
 */
function toPrimary(value: string): string | boolean {
  if (value.toLowerCase() === 'oui') return true;
  if (value.toLowerCase() === 'non') return false;
  return value;
}

describe('evaluateIdentite', () => {
  // L'import accepte une valeur quelle que soit sa casse : l'évaluation ne doit
  // pas rendre un autre résultat, ni lever, pour une valeur ainsi acceptée.
  const cases = Object.entries(IDENTITE_ALLOWED_VALUES).flatMap(
    ([field, values]) => values.map((value) => [field, value] as const)
  );

  it.each(cases)(
    'identite(%s, %s) ne dépend pas de la casse de la valeur',
    (field, value) => {
      const lower = toPrimary(value);
      const upper = toPrimary(value.toUpperCase());
      const expected = evaluateIdentite(IDENTITE_COMPLETE, field, lower);

      expect(evaluateIdentite(IDENTITE_COMPLETE, field, upper)).toBe(expected);
    }
  );

  it.each<[IdentiteField, string, Partial<IdentiteCollectivite>]>([
    ['localisation', 'dom', { drom: true }],
    ['localisation', 'Dom', { drom: true }],
    ['localisation', 'METROPOLE', { drom: false }],
    ['localisation', 'Metropole', { drom: false }],
    [
      'population',
      'PLUS_DE_20000',
      { populationTags: [CollectivitePopulationTypeEnum.PLUS_DE_20000] },
    ],
    [
      'commune_membre',
      'PLUS_DE_45000',
      {
        communesMembresPopulationTags: [
          CollectivitePopulationTypeEnum.PLUS_DE_45000,
        ],
      },
    ],
    ['sinoe', 'URBAIN', { sinoeId: 'urbain' }],
  ])(
    'identite(%s, %s) est vrai quelle que soit la casse',
    (field, value, identite) => {
      expect(
        evaluateIdentite({ ...IDENTITE_COMPLETE, ...identite }, field, value)
      ).toBe(true);
    }
  );

  it('identite(localisation, dom) est faux pour une collectivité de métropole', () => {
    expect(
      evaluateIdentite(
        { ...IDENTITE_COMPLETE, drom: false },
        'localisation',
        'dom'
      )
    ).toBe(false);
  });
});
