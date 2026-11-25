import {
  type IndicateurDetaille,
  type IndicateurTotal,
  type IndicateurTotalAtDate,
  type IndicateurValeur,
} from '@tet/domain/indicateurs';
import { uniq } from 'es-toolkit';
import type { IndicateurValeurField } from '../valeurs/grid/types';
import { toSousIndicateurColorOf } from './sous-indicateurs-colors';

export type SousIndicateurNode = Readonly<{
  id: number;
  label: string;
  enfantIds: readonly number[];
  sansValeurUtilisateur?: boolean;
}>;

export type SousIndicateurDatedValeur = Readonly<
  Pick<IndicateurValeur, 'dateValeur' | 'resultat' | 'objectif'>
>;

export type SousIndicateurCell =
  | Readonly<{ status: 'empty' }>
  | Extract<IndicateurTotal, { status: 'hidden' }>
  | (Extract<IndicateurTotal, { status: 'incomplete' }> &
      Readonly<{ missingLabels: readonly string[] }>)
  | Readonly<{
      status: 'value';
      valeur: Extract<IndicateurTotal, { status: 'complete' }>['valeur'];
    }>;

export type SousIndicateurPeriodCells = Readonly<
  Record<IndicateurValeurField, SousIndicateurCell>
>;

export type SousIndicateurColumn = Readonly<{ dateValeur: string }>;

export type SousIndicateurRowCell = Readonly<
  { dateValeur: string } & SousIndicateurPeriodCells
>;

export type SousIndicateurTableRow = Readonly<{
  rowKey: string;
  parentRowKey: string | null;
  isExpandable: boolean;
  acceptsOwnValeurs?: boolean;
  indicateurId: number;
  label: string;
  color: string;
  depth: number;
  cells: readonly SousIndicateurRowCell[];
}>;

export type SousIndicateursTableData = Readonly<{
  columns: readonly SousIndicateurColumn[];
  rows: readonly SousIndicateurTableRow[];
  totalCells: readonly SousIndicateurRowCell[];
}>;

type TableNode = Readonly<{
  rowKey: string;
  parentRowKey: string | null;
  node: SousIndicateurNode;
  depth: number;
}>;

type CellsByDate = ReadonlyMap<string, SousIndicateurPeriodCells>;

export type SousIndicateursSource = Readonly<{
  nodesById: ReadonlyMap<number, SousIndicateurNode>;
  valeursByIndicateurId: ReadonlyMap<
    number,
    readonly SousIndicateurDatedValeur[]
  >;
  totalsByIndicateurId: ReadonlyMap<number, readonly IndicateurTotalAtDate[]>;
}>;

const EMPTY_CELL: SousIndicateurCell = { status: 'empty' };

export const toSousIndicateurNode = ({
  id,
  titre,
  titreCourt,
  enfants,
  sansValeurUtilisateur,
}: Pick<IndicateurDetaille, 'id' | 'titre' | 'titreCourt'> &
  Partial<Pick<IndicateurDetaille, 'sansValeurUtilisateur'>> &
  Readonly<{
    enfants: readonly Pick<IndicateurDetaille['enfants'][number], 'id'>[];
  }>): SousIndicateurNode => ({
  id,
  label: titreCourt || titre,
  enfantIds: enfants.map((enfant) => enfant.id),
  sansValeurUtilisateur,
});

const toCellFromValeur = (valeur: number | null): SousIndicateurCell =>
  valeur === null ? EMPTY_CELL : { status: 'value', valeur };

const toCellFromTotal = (
  total: IndicateurTotal,
  listMissingLabels: () => readonly string[]
): SousIndicateurCell => {
  switch (total.status) {
    case 'complete':
      return { status: 'value', valeur: total.valeur };
    case 'incomplete':
      return {
        status: 'incomplete',
        filledCount: total.filledCount,
        expectedCount: total.expectedCount,
        missingLabels: listMissingLabels(),
      };
    case 'hidden':
      return { status: 'hidden' };
    case 'not-additive':
    case 'no-sous-indicateur':
      return EMPTY_CELL;
  }
};

const compareNodes = (
  left: SousIndicateurNode,
  right: SousIndicateurNode
): number => left.id - right.id;

const toCellsByDateFromValeurs = (
  valeurs: readonly SousIndicateurDatedValeur[]
): CellsByDate =>
  new Map(
    valeurs.map(({ dateValeur, resultat, objectif }) => [
      dateValeur,
      {
        resultat: toCellFromValeur(resultat),
        objectif: toCellFromValeur(objectif),
      },
    ])
  );

type ListMissingLabels = (
  params: Readonly<{ dateValeur: string; field: IndicateurValeurField }>
) => readonly string[];

const toCellsByDateFromTotals = ({
  totals,
  listMissingLabels,
}: {
  totals: readonly IndicateurTotalAtDate[];
  listMissingLabels: ListMissingLabels;
}): CellsByDate =>
  new Map(
    totals.map(({ dateValeur, resultat, objectif }) => [
      dateValeur,
      {
        resultat: toCellFromTotal(resultat, () =>
          listMissingLabels({ dateValeur, field: 'resultat' })
        ),
        objectif: toCellFromTotal(objectif, () =>
          listMissingLabels({ dateValeur, field: 'objectif' })
        ),
      },
    ])
  );

export const listChildNodes = ({
  enfantIds,
  visitedIds,
  nodesById,
}: {
  enfantIds: readonly number[];
  visitedIds: ReadonlySet<number>;
  nodesById: ReadonlyMap<number, SousIndicateurNode>;
}): SousIndicateurNode[] =>
  uniq(enfantIds)
    .flatMap((enfantId) => {
      const node = nodesById.get(enfantId);
      return node === undefined || visitedIds.has(enfantId) ? [] : [node];
    })
    .sort(compareNodes);

const listTableNodes = ({
  nodes,
  depth,
  parentRowKey,
  visitedIds,
  nodesById,
}: {
  nodes: readonly SousIndicateurNode[];
  depth: number;
  parentRowKey: string;
  visitedIds: ReadonlySet<number>;
  nodesById: ReadonlyMap<number, SousIndicateurNode>;
}): TableNode[] =>
  nodes.flatMap((node) => {
    const rowKey = `${parentRowKey}/${node.id}`;
    const descendantVisitedIds = new Set([...visitedIds, node.id]);
    return [
      {
        rowKey,
        parentRowKey: depth === 0 ? null : parentRowKey,
        node,
        depth,
      },
      ...listTableNodes({
        nodes: listChildNodes({
          enfantIds: node.enfantIds,
          visitedIds: descendantVisitedIds,
          nodesById,
        }),
        depth: depth + 1,
        parentRowKey: rowKey,
        visitedIds: descendantVisitedIds,
        nodesById,
      }),
    ];
  });

const listRootTableNodes = ({
  rootId,
  nodesById,
}: {
  rootId: number;
  nodesById: ReadonlyMap<number, SousIndicateurNode>;
}): TableNode[] => {
  const visitedIds = new Set([rootId]);
  return listTableNodes({
    nodes: listChildNodes({
      enfantIds: nodesById.get(rootId)?.enfantIds ?? [],
      visitedIds,
      nodesById,
    }),
    depth: 0,
    parentRowKey: String(rootId),
    visitedIds,
    nodesById,
  });
};

export const listSousIndicateurIdsInTableOrder = (
  params: Readonly<{
    rootId: number;
    nodesById: ReadonlyMap<number, SousIndicateurNode>;
  }>
): number[] => uniq(listRootTableNodes(params).map(({ node }) => node.id));

const toMissingLabelsLister =
  ({
    parent,
    context,
  }: {
    parent: Pick<SousIndicateurNode, 'id' | 'enfantIds'>;
    context: SousIndicateursSource;
  }): ListMissingLabels =>
  ({ dateValeur, field }) =>
    listChildNodes({
      enfantIds: parent.enfantIds,
      visitedIds: new Set([parent.id]),
      nodesById: context.nodesById,
    })
      .filter(
        (child) =>
          toCellsByDateOfNode({ node: child, context }).get(dateValeur)?.[field]
            .status !== 'value'
      )
      .map(({ label }) => label);

const toCellsByDateOfNode = ({
  node,
  context,
}: {
  node: SousIndicateurNode;
  context: SousIndicateursSource;
}): CellsByDate =>
  node.enfantIds.length > 0 && context.totalsByIndicateurId.has(node.id)
    ? toCellsByDateFromTotals({
        totals: context.totalsByIndicateurId.get(node.id) ?? [],
        listMissingLabels: toMissingLabelsLister({ parent: node, context }),
      })
    : toCellsByDateFromValeurs(
        context.valeursByIndicateurId.get(node.id) ?? []
      );

const listDates = (cellsByDateList: readonly CellsByDate[]): string[] =>
  uniq(
    cellsByDateList.flatMap((cellsByDate) => [...cellsByDate.keys()])
  ).toSorted();

const toRowCells = ({
  cellsByDate,
  columns,
}: {
  cellsByDate: CellsByDate;
  columns: readonly SousIndicateurColumn[];
}): SousIndicateurRowCell[] =>
  columns.map(({ dateValeur }) => ({
    dateValeur,
    resultat: cellsByDate.get(dateValeur)?.resultat ?? EMPTY_CELL,
    objectif: cellsByDate.get(dateValeur)?.objectif ?? EMPTY_CELL,
  }));

export const buildSousIndicateursTableData = ({
  rootId,
  ...context
}: SousIndicateursSource &
  Readonly<{ rootId: number }>): SousIndicateursTableData => {
  const tableNodes = listRootTableNodes({
    rootId,
    nodesById: context.nodesById,
  });
  const colorOf = toSousIndicateurColorOf(
    tableNodes.map(({ node }) => node.id)
  );
  const parentRowKeys = new Set(
    tableNodes.map(({ parentRowKey }) => parentRowKey)
  );
  const rowsWithCellsByDate = tableNodes.map((tableNode) => ({
    tableNode,
    cellsByDate: toCellsByDateOfNode({ node: tableNode.node, context }),
  }));
  const rootTotals = context.totalsByIndicateurId.get(rootId) ?? [];
  const totalCellsByDate = toCellsByDateFromTotals({
    totals: rootTotals,
    listMissingLabels: toMissingLabelsLister({
      parent: {
        id: rootId,
        enfantIds: context.nodesById.get(rootId)?.enfantIds ?? [],
      },
      context,
    }),
  });
  const columns = listDates([
    totalCellsByDate,
    ...rowsWithCellsByDate.map(({ cellsByDate }) => cellsByDate),
  ]).map((dateValeur) => ({ dateValeur }));

  return {
    columns,
    rows: rowsWithCellsByDate.map(
      ({ tableNode: { rowKey, parentRowKey, node, depth }, cellsByDate }) => ({
        rowKey,
        parentRowKey,
        isExpandable: parentRowKeys.has(rowKey),
        acceptsOwnValeurs: node.sansValeurUtilisateur !== true,
        indicateurId: node.id,
        label: node.label,
        color: colorOf(node.id),
        depth,
        cells: toRowCells({ cellsByDate, columns }),
      })
    ),
    totalCells: toRowCells({ cellsByDate: totalCellsByDate, columns }),
  };
};

export const findLatestResultatDate = ({
  rows,
  totalCells,
}: Pick<SousIndicateursTableData, 'rows' | 'totalCells'>): string | null => {
  const datesWithResultat = [
    ...rows.flatMap(({ cells }) => cells),
    ...totalCells,
  ]
    .filter(({ resultat }) => resultat.status === 'value')
    .map(({ dateValeur }) => dateValeur);

  return datesWithResultat.length === 0
    ? null
    : datesWithResultat.reduce((latest, date) =>
        date > latest ? date : latest
      );
};
