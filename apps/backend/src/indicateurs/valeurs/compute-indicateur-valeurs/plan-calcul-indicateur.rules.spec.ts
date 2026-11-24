import {
  IndicateurPeriodes,
  IndicateurPeriodiciteEnum,
  IndicateurPredefini,
} from '@tet/domain/indicateurs';
import { toIndicateurRow } from '../../indicateur/indicateur-row.test-fixture';
import type {
  CalculSourceGroup,
  CalculSourceValeur,
  IndicateurFormula,
} from './calcul-indicateur.types';
import {
  planCalculIndicateur,
  roundCalculResult,
} from './plan-calcul-indicateur.rules';

const periode = IndicateurPeriodes.parse(
  IndicateurPeriodiciteEnum.ANNUELLE,
  '2024'
);

const definition = toIndicateurRow({
  id: 10,
  identifiantReferentiel: 'cae_2',
  valeurCalcule: 'VAL(cae_1) * 2',
  periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
  precision: 1,
}) as IndicateurPredefini;

const formula: IndicateurFormula = {
  definition,
  references: [{ identifiant: 'cae_1', optional: false, tokens: ['val'] }],
};

const sourceValeur = (
  overrides: Partial<CalculSourceValeur>
): CalculSourceValeur =>
  ({
    collectiviteId: 1,
    indicateurId: 1,
    indicateurIdentifiant: 'cae_1',
    dateValeur: '2024-01-01',
    periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
    resultat: 4,
    objectif: null,
    sourceId: null,
    metadonneeId: null,
    periode,
    deleted: false,
    ...overrides,
  } as CalculSourceValeur);

const group = (overrides: Partial<CalculSourceGroup>): CalculSourceGroup => ({
  collectiviteId: 1,
  periode,
  sourceId: null,
  metadonneeId: null,
  valeurs: [sourceValeur({})],
  requiresDirectValueForField: false,
  ...overrides,
});

describe('planCalculIndicateur', () => {
  test('planifie le résultat avec l’expression en minuscules, les valeurs et la précision', () => {
    expect(planCalculIndicateur(formula, { key: group({}) })).toEqual([
      {
        valeur: expect.objectContaining({
          collectiviteId: 1,
          indicateurId: 10,
          dateValeur: '2024-01-01',
          calculAuto: true,
          calculAutoIdentifiantsManquants: [],
        }),
        resultat: {
          expression: 'val(cae_1) * 2',
          values: { cae_1: 4 },
          precision: 1,
        },
        objectif: null,
      },
    ]);
  });

  test('ne planifie rien quand la périodicité du groupe diffère de celle de l’indicateur', () => {
    const monthly = group({
      periode: IndicateurPeriodes.parse(
        IndicateurPeriodiciteEnum.MENSUELLE,
        '2024-01'
      ),
    });

    expect(planCalculIndicateur(formula, { key: monthly })).toEqual([]);
  });

  test('ne planifie rien quand une référence obligatoire est absente', () => {
    const withoutSource = group({ valeurs: [] });

    expect(planCalculIndicateur(formula, { key: withoutSource })).toEqual([]);
  });

  test('ne planifie rien pour un indicateur sans formule', () => {
    const withoutFormula = {
      ...formula,
      definition: { ...definition, valeurCalcule: null },
    };

    expect(planCalculIndicateur(withoutFormula, { key: group({}) })).toEqual(
      []
    );
  });
});

describe('roundCalculResult', () => {
  test('arrondit à la précision demandée', () => {
    expect(roundCalculResult(1.2345, 2)).toBe(1.23);
  });

  test('laisse un résultat nul à null', () => {
    expect(roundCalculResult(null, 2)).toBeNull();
  });
});
