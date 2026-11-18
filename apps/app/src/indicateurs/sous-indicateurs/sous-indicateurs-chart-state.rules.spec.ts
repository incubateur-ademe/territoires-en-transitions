import { COLLECTIVITE_SOURCE_ID } from '@tet/domain/indicateurs';
import { describe, expect, it } from 'vitest';
import { toSousIndicateursChartState } from './sous-indicateurs-chart-state.rules';
import type {
  ParentTotals,
  QueryOutcome,
  SousIndicateursOutcomes,
  ValeursIndicateurs,
} from './sous-indicateurs-table-state.rules';
import type { SousIndicateurNode } from './sous-indicateurs-table.rules';

const ROOT_ID = 1;
const LEAF_ID = 2;

const toValeursIndicateurs = (
  indicateurs: readonly {
    id: number;
    valeurs: readonly { dateValeur: string; resultat: number | null }[];
  }[]
): ValeursIndicateurs =>
  indicateurs.map(({ id, valeurs }) => ({
    definition: { id },
    sources: { [COLLECTIVITE_SOURCE_ID]: { valeurs } },
  })) as unknown as ValeursIndicateurs;

const toSuccess = <Data>(data: Data): QueryOutcome<Data> => ({
  status: 'success',
  data,
});

const pending = { status: 'pending' } as const;
const failed = { status: 'error' } as const;

const readyOutcomes: SousIndicateursOutcomes = {
  collectiviteId: 7,
  nodes: toSuccess<readonly SousIndicateurNode[]>([
    { id: ROOT_ID, label: 'Déchets', enfantIds: [LEAF_ID] },
    { id: LEAF_ID, label: 'Verre', enfantIds: [] },
  ]),
  valeurs: toSuccess(
    toValeursIndicateurs([
      {
        id: LEAF_ID,
        valeurs: [{ dateValeur: '2022-01-01', resultat: 5 }],
      },
    ])
  ),
  totals: toSuccess<readonly ParentTotals[]>([
    {
      indicateurId: ROOT_ID,
      totals: [
        {
          dateValeur: '2022-01-01',
          resultat: { status: 'complete', valeur: 5 },
          objectif: { status: 'incomplete', filledCount: 0, expectedCount: 1 },
        },
      ],
    },
  ]),
};

const toState = (overrides: Partial<SousIndicateursOutcomes> = {}) =>
  toSousIndicateursChartState({
    indicateurId: ROOT_ID,
    ...readyOutcomes,
    ...overrides,
  });

describe('toSousIndicateursChartState', () => {
  it('construit les données du graphique une fois toutes les requêtes arrivées', () => {
    expect(toState()).toMatchObject({
      status: 'ready',
      data: {
        mode: 'stacked',
        dates: ['2022-01-01'],
        resultatTotal: [5],
      },
    });
  });

  it("reste en chargement tant que les nœuds de l'arbre ne sont pas arrivés", () => {
    expect(toState({ nodes: pending })).toEqual({ status: 'loading' });
  });

  it('reste en chargement tant que les totaux ne sont pas arrivés', () => {
    expect(toState({ totals: pending })).toEqual({ status: 'loading' });
  });

  it("est en erreur dès qu'une requête échoue, même si une autre charge encore", () => {
    expect(toState({ valeurs: failed, totals: pending })).toEqual({
      status: 'error',
    });
  });

  it("est prêt sans donnée quand l'arbre n'a aucune valeur à tracer", () => {
    expect(
      toState({
        valeurs: toSuccess(toValeursIndicateurs([])),
        totals: toSuccess<readonly ParentTotals[]>([
          { indicateurId: ROOT_ID, totals: [] },
        ]),
      })
    ).toEqual({ status: 'ready', data: null });
  });

  it("est prêt sans donnée quand l'indicateur n'a aucun sous-indicateur", () => {
    expect(
      toState({
        nodes: toSuccess<readonly SousIndicateurNode[]>([
          { id: ROOT_ID, label: 'Déchets', enfantIds: [] },
        ]),
        valeurs: pending,
        totals: toSuccess<readonly ParentTotals[]>([]),
      })
    ).toEqual({ status: 'ready', data: null });
  });
});
