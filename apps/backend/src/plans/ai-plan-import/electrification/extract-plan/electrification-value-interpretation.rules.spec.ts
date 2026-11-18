import { describe, expect, it } from 'vitest';
import { ElectrificationValueInterpretationRules as Rules } from './electrification-value-interpretation.rules';
import type {
  ElectrificationValueRequest,
  ElectrificationValueResponse,
} from './electrification-value-interpretation.schema';

type TargetRequest = Extract<ElectrificationValueRequest, { kind: 'target' }>;
const targets: TargetRequest['targets'] = [
  {
    key: 'parc',
    unit: 'bâtiments',
    year: 2030,
    labels: ['parc communal'],
    units: [],
  },
  {
    key: 'ecoles',
    unit: 'bâtiments',
    year: 2040,
    labels: ['écoles'],
    units: [],
  },
];
const request = (text: string, definitions = targets): TargetRequest => ({
  kind: 'target',
  label: 'Rénovation',
  source: { id: 'valeur', section: 'A', text, location: 'Cibles', links: [] },
  keys: definitions.map(({ key }) => key),
  targets: definitions,
  unit: null,
  year: null,
});
const value = (
  key: string,
  number: string,
  quote: string,
  year: string | null = null
): ElectrificationValueResponse['values'][number] => ({
  key,
  number,
  quote,
  year,
  unit: null,
});

describe('Preuves des cibles interprétées', () => {
  it('exige un libellé entier et conserve les libellés composés et leurs séparateurs', () => {
    expect(
      Rules.normalize(request('parcelles : 8'), [
        value('parc', '8', 'parcelles : 8'),
      ])
    ).toBeNull();
    expect(
      Rules.normalize(request('parc : 8'), [value('parc', '8', 'parc : 8')])
    ).toBe('parc: 8');
    expect(
      Rules.normalize(request('parc-communal : 8'), [
        value('parc', '8', 'parc-communal : 8'),
      ])
    ).toBe('parc: 8');
  });

  it("ne transforme pas le libellé d'une autre cible en exception d'unité", () => {
    const definitions = [
      {
        key: 'energie',
        unit: 'MWh',
        year: 2030,
        labels: ['énergie'],
        units: [],
      },
      { key: 'puissance', unit: 'kW', year: 2040, labels: ['kW'], units: [] },
    ];
    expect(
      Rules.normalize(request('énergie : 42 kW', definitions), [
        value('energie', '42', 'énergie : 42'),
      ])
    ).toBeNull();
    expect(
      Rules.normalize(request('2 écoles'), [value('ecoles', '2', '2 écoles')])
    ).toBe('ecoles: 2');
  });

  it("refuse une année empruntée à la quantité d'un autre segment", () => {
    const text = 'parc : 8 en 2040 ; écoles : 2';
    expect(
      Rules.normalize(request(text), [
        value('parc', '8', 'parc : 8'),
        value('ecoles', '2', '2040 ; écoles : 2', '2040'),
      ])
    ).toBeNull();
  });

  it.each([' ; ', '\n'])(
    'refuse un libellé emprunté au segment voisin (séparateur %j)',
    (separator) => {
      const text = ['Parc : 8', 'écoles : 2', 'bilan du parc'].join(separator);
      expect(
        Rules.normalize(request(text), [
          value('ecoles', '8', `8${separator}écoles`),
          value('parc', '2', `2${separator}bilan du parc`),
        ])
      ).toBeNull();
      expect(
        Rules.normalize(request(text), [
          value('parc', '8', 'Parc : 8'),
          value('ecoles', '2', 'écoles : 2'),
        ])
      ).toBe('parc: 8; ecoles: 2');
    }
  );

  it('conserve une année explicite pour sa cible et les années absentes fournies par le catalogue', () => {
    expect(
      Rules.normalize(request('parc : 8 en 2030 ; écoles : 2'), [
        value('parc', '8', 'parc : 8 en 2030', '2030'),
        value('ecoles', '2', 'écoles : 2'),
      ])
    ).toBe('parc: 8; ecoles: 2');
    expect(
      Rules.normalize(request('parc : 8 ; écoles : 2'), [
        value('parc', '8', 'parc : 8'),
        value('ecoles', '2', 'écoles : 2'),
      ])
    ).toBe('parc: 8; ecoles: 2');
    expect(
      Rules.normalize(request('parc : 2030 en 2030', [targets[0]]), [
        value('parc', '2030', 'parc : 2030 en 2030', '2030'),
      ])
    ).toBe('2030');
  });
});
