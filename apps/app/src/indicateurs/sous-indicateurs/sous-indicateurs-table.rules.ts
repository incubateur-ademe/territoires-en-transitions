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
}>;

export type SousIndicateurDatedValeur = Readonly<
  Pick<IndicateurValeur, 'dateValeur' | 'resultat' | 'objectif'>
>;

export type SousIndicateurCell =
  | Readonly<{ status: 'empty' }>
  | Extract<IndicateurTotal, { status: 'hidden' }>
  | Extract<IndicateurTotal, { status: 'incomplete' }>
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
  indicateurId: number;
  label: string;
  color: string;
  depth: number;
  cells: readonly SousIndicateurRowCell[];
}>;

export type SousIndicateursTableData = Readonly<{
  columns: readonly SousIndicateurColumn[];
  rows: readonly SousIndicateurTableRow[];
  hasTotalRow: boolean;
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
}: Pick<IndicateurDetaille, 'id' | 'titre' | 'titreCourt'> &
  Readonly<{
    enfants: readonly Pick<IndicateurDetaille['enfants'][number], 'id'>[];
  }>): SousIndicateurNode => ({
  id,
  label: titreCourt || titre,
  enfantIds: enfants.map((enfant) => enfant.id),
});

const toCellFromValeur = (valeur: number | null): SousIndicateurCell =>
  valeur === null ? EMPTY_CELL : { status: 'value', valeur };

const toCellFromTotal = (total: IndicateurTotal): SousIndicateurCell => {
  switch (total.status) {
    case 'complete':
      return { status: 'value', valeur: total.valeur };
    case 'incomplete':
      return {
        status: 'incomplete',
        filledCount: total.filledCount,
        expectedCount: total.expectedCount,
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
): number =>
  left.label.localeCompare(right.label, 'fr', { numeric: true }) ||
  left.id - right.id;

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

const toCellsByDateFromTotals = (
  totals: readonly IndicateurTotalAtDate[]
): CellsByDate =>
  new Map(
    totals.map(({ dateValeur, resultat, objectif }) => [
      dateValeur,
      {
        resultat: toCellFromTotal(resultat),
        objectif: toCellFromTotal(objectif),
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

const toCellsByDateOfNode = ({
  node,
  context,
}: {
  node: SousIndicateurNode;
  context: SousIndicateursSource;
}): CellsByDate =>
  node.enfantIds.length > 0
    ? toCellsByDateFromTotals(context.totalsByIndicateurId.get(node.id) ?? [])
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

export const hasNotAdditiveObjectif = (
  totals: readonly IndicateurTotalAtDate[]
): boolean => totals.some(({ objectif }) => objectif.status === 'not-additive');

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
  const totalCellsByDate = toCellsByDateFromTotals(rootTotals);
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
        indicateurId: node.id,
        label: node.label,
        color: colorOf(node.id),
        depth,
        cells: toRowCells({ cellsByDate, columns }),
      })
    ),
    hasTotalRow: !hasNotAdditiveObjectif(rootTotals),
    totalCells: toRowCells({ cellsByDate: totalCellsByDate, columns }),
  };
};
