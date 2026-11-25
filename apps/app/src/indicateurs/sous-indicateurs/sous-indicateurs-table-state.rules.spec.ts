import { COLLECTIVITE_SOURCE_ID } from '@tet/domain/indicateurs';
import { describe, expect, it } from 'vitest';
import type { ListIndicateurValeurOuput } from '../valeurs/use-list-indicateur-valeurs';
import {
  toQueryOutcome,
  toSousIndicateursTableState,
  toTotalsOutcome,
  toValeursByIndicateurId,
  type ParentTotals,
  type QueryOutcome,
} from './sous-indicateurs-table-state.rules';
import type { SousIndicateurNode } from './sous-indicateurs-table.rules';

type ValeursIndicateurs = ListIndicateurValeurOuput['indicateurs'];

const toValeursIndicateurs = (
  indicateurs: readonly {
    id: number;
    valeurs: readonly {
      dateValeur: string;
      resultat?: number | null;
      objectif?: number | null;
    }[];
  }[]
): ValeursIndicateurs =>
  indicateurs.map(({ id, valeurs }) => ({
    definition: { id },
    sources: { [COLLECTIVITE_SOURCE_ID]: { valeurs } },
  })) as unknown as ValeursIndicateurs;

const treeNodes: readonly SousIndicateurNode[] = [
  { id: 1, label: 'Déchets', enfantIds: [2] },
  { id: 2, label: 'Verre', enfantIds: [] },
];

const rootOnlyNodes: readonly SousIndicateurNode[] = [
  { id: 1, label: 'Déchets', enfantIds: [] },
];

const pending = { status: 'pending' } as const;
const failed = { status: 'error' } as const;

const toSuccess = <Data>(data: Data): QueryOutcome<Data> => ({
  status: 'success',
  data,
});

const readyNodes = toSuccess(treeNodes);

const readyValeurs = toSuccess(
  toValeursIndicateurs([
    {
      id: 2,
      valeurs: [{ dateValeur: '2022-01-01', resultat: 5, objectif: undefined }],
    },
  ])
);

const readyTotals = toSuccess<readonly ParentTotals[]>([
  {
    indicateurId: 1,
    totals: [
      {
        dateValeur: '2022-01-01',
        resultat: { status: 'complete', valeur: 5 },
        objectif: { status: 'no-sous-indicateur' },
      },
    ],
  },
]);

const toState = ({
  nodes = readyNodes,
  valeurs = readyValeurs,
  totals = readyTotals,
}: {
  nodes?: QueryOutcome<readonly SousIndicateurNode[]>;
  valeurs?: QueryOutcome<ValeursIndicateurs>;
  totals?: QueryOutcome<readonly ParentTotals[]>;
} = {}) =>
  toSousIndicateursTableState({
    indicateurId: 1,
    collectiviteId: 12,
    nodes,
    valeurs,
    totals,
  });

describe('toSousIndicateursTableState', () => {
  it('est prêt avec la collectivité et les données quand toutes les requêtes ont répondu', () => {
    expect(toState()).toMatchObject({
      status: 'ready',
      collectiviteId: 12,
      data: {
        columns: [{ dateValeur: '2022-01-01' }],
        rows: [
          {
            indicateurId: 2,
            label: 'Verre',
            depth: 0,
            cells: [
              {
                dateValeur: '2022-01-01',
                resultat: { status: 'value', valeur: 5 },
                objectif: { status: 'empty' },
              },
            ],
          },
        ],
        totalCells: [
          {
            dateValeur: '2022-01-01',
            resultat: { status: 'value', valeur: 5 },
            objectif: { status: 'empty' },
          },
        ],
      },
    });
  });

  it('charge tant que les sous-indicateurs ne sont pas listés', () => {
    expect(toState({ nodes: pending })).toEqual({ status: 'loading' });
  });

  it('charge tant que les valeurs ne sont pas arrivées alors que des sous-indicateurs existent', () => {
    expect(toState({ valeurs: pending })).toEqual({ status: 'loading' });
  });

  it('charge tant que les totaux ne sont pas arrivés', () => {
    expect(toState({ totals: pending })).toEqual({ status: 'loading' });
  });

  it("est prêt sans attendre les valeurs quand l'indicateur n'a que lui-même dans ses nœuds", () => {
    expect(
      toState({
        nodes: toSuccess(rootOnlyNodes),
        valeurs: pending,
        totals: toSuccess([]),
      })
    ).toMatchObject({
      status: 'ready',
      collectiviteId: 12,
      data: { columns: [], rows: [], totalCells: [] },
    });
  });

  it.each([
    { requete: 'des sous-indicateurs', failing: { nodes: failed } },
    { requete: 'des valeurs', failing: { valeurs: failed } },
    { requete: 'des totaux', failing: { totals: failed } },
  ])(
    'est en erreur dès que la requête $requete échoue, même si une autre charge encore',
    ({ failing }) => {
      expect(toState({ nodes: pending, ...failing })).toEqual({
        status: 'error',
      });
    }
  );

  it("garde l'erreur prioritaire sur le chargement des totaux", () => {
    expect(toState({ valeurs: failed, totals: pending })).toEqual({
      status: 'error',
    });
  });
});

describe('toQueryOutcome', () => {
  it('signale une erreur même quand une donnée est encore présente', () => {
    expect(toQueryOutcome({ isError: true, data: [1] })).toEqual(failed);
  });

  it("reste en attente tant qu'aucune donnée n'est arrivée", () => {
    expect(toQueryOutcome({ isError: false, data: undefined })).toEqual(
      pending
    );
  });

  it('renvoie la donnée une fois arrivée, même vide', () => {
    expect(toQueryOutcome({ isError: false, data: [] })).toEqual({
      status: 'success',
      data: [],
    });
  });
});

describe('toTotalsOutcome', () => {
  const rootTotals: ParentTotals = { indicateurId: 1, totals: [] };
  const middleTotals: ParentTotals = { indicateurId: 2, totals: [] };

  it('renvoie les totaux de chaque parent quand toutes les requêtes ont répondu', () => {
    expect(
      toTotalsOutcome([
        { isError: false, data: rootTotals },
        { isError: false, data: middleTotals },
      ])
    ).toEqual({ status: 'success', data: [rootTotals, middleTotals] });
  });

  it("est prêt avec aucun total quand l'indicateur n'a aucun parent à interroger", () => {
    expect(toTotalsOutcome([])).toEqual({ status: 'success', data: [] });
  });

  it("reste en attente tant qu'un total n'est pas arrivé", () => {
    expect(
      toTotalsOutcome([
        { isError: false, data: rootTotals },
        { isError: false, data: undefined },
      ])
    ).toEqual(pending);
  });

  it("signale l'erreur d'un seul total même quand les autres sont arrivés ou en attente", () => {
    expect(
      toTotalsOutcome([
        { isError: false, data: undefined },
        { isError: true, data: undefined },
        { isError: false, data: rootTotals },
      ])
    ).toEqual(failed);
  });
});

describe('toValeursByIndicateurId', () => {
  it('ne garde que les valeurs de la collectivité et remplace une valeur absente par null', () => {
    const indicateurs = toValeursIndicateurs([
      {
        id: 2,
        valeurs: [
          { dateValeur: '2022-01-01', resultat: 5 },
          { dateValeur: '2023-01-01', objectif: 8, resultat: undefined },
        ],
      },
    ]);

    expect(toValeursByIndicateurId(indicateurs)).toEqual(
      new Map([
        [
          2,
          [
            { dateValeur: '2022-01-01', resultat: 5, objectif: null },
            { dateValeur: '2023-01-01', resultat: null, objectif: 8 },
          ],
        ],
      ])
    );
  });

  it('renvoie une liste vide pour un indicateur sans valeur de la collectivité', () => {
    const indicateurs = [
      { definition: { id: 3 }, sources: {} },
    ] as unknown as ValeursIndicateurs;

    expect(toValeursByIndicateurId(indicateurs)).toEqual(new Map([[3, []]]));
  });
});
