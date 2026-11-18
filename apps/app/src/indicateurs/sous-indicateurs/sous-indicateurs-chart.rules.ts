import type {
  IndicateurTotal,
  IndicateurTotalAtDate,
} from '@tet/domain/indicateurs';
import { uniq, uniqBy } from 'es-toolkit';
import { toSousIndicateurColorOf } from './sous-indicateurs-colors';
import {
  hasNotAdditiveObjectif,
  listChildNodes,
  listSousIndicateurIdsInTableOrder,
  type SousIndicateurDatedValeur,
  type SousIndicateurNode,
  type SousIndicateursSource,
} from './sous-indicateurs-table.rules';

type ValeurByDate = ReadonlyMap<string, number>;

export type SousIndicateurChartValeurs = readonly (number | null)[];

export type SousIndicateurChartSerie = Readonly<{
  indicateurId: number;
  label: string;
  color: string;
  valeurs: SousIndicateurChartValeurs;
}>;

export type SousIndicateurChartLine = Readonly<{
  indicateurId: number;
  label: string;
  color: string;
  resultatValeurs: SousIndicateurChartValeurs | null;
  objectifValeurs: SousIndicateurChartValeurs | null;
}>;

export type SousIndicateursChartData =
  | Readonly<{
      mode: 'stacked';
      dates: readonly string[];
      leaves: readonly SousIndicateurChartSerie[];
      resultatTotal: SousIndicateurChartValeurs | null;
      objectifTotal: SousIndicateurChartValeurs | null;
    }>
  | Readonly<{
      mode: 'lines';
      dates: readonly string[];
      lines: readonly SousIndicateurChartLine[];
    }>;

type ChartField = 'resultat' | 'objectif';

type NodeValeurs = Readonly<{
  node: SousIndicateurNode;
  resultatByDate: ValeurByDate;
  objectifByDate: ValeurByDate;
}>;

const toTotalValeur = (total: IndicateurTotal): number | null =>
  total.status === 'complete' ? total.valeur : null;

const toValeurByDateFromTotals = ({
  totals,
  field,
}: {
  totals: readonly IndicateurTotalAtDate[];
  field: ChartField;
}): ValeurByDate =>
  new Map(
    totals.flatMap((totalAtDate) => {
      const valeur = toTotalValeur(totalAtDate[field]);
      return valeur === null ? [] : [[totalAtDate.dateValeur, valeur] as const];
    })
  );

const toValeurByDateFromValeurs = ({
  valeurs,
  field,
}: {
  valeurs: readonly SousIndicateurDatedValeur[];
  field: ChartField;
}): ValeurByDate =>
  new Map(
    valeurs.flatMap((valeur) => {
      const fieldValeur = valeur[field];
      return fieldValeur === null
        ? []
        : [[valeur.dateValeur, fieldValeur] as const];
    })
  );

const listDates = (valeurByDates: readonly ValeurByDate[]): string[] =>
  uniq(
    valeurByDates.flatMap((valeurByDate) => [...valeurByDate.keys()])
  ).sort();

const alignOnDates = ({
  dates,
  valeurByDate,
}: {
  dates: readonly string[];
  valeurByDate: ValeurByDate;
}): SousIndicateurChartValeurs =>
  dates.map((date) => valeurByDate.get(date) ?? null);

const toSeries = ({
  entries,
  dates,
  colorOf,
}: {
  entries: readonly NodeValeurs[];
  dates: readonly string[];
  colorOf: (indicateurId: number) => string;
}): SousIndicateurChartSerie[] =>
  entries.map(({ node, resultatByDate }) => ({
    indicateurId: node.id,
    label: node.label,
    color: colorOf(node.id),
    valeurs: alignOnDates({ dates, valeurByDate: resultatByDate }),
  }));

const toLines = ({
  entries,
  dates,
  colorOf,
}: {
  entries: readonly NodeValeurs[];
  dates: readonly string[];
  colorOf: (indicateurId: number) => string;
}): SousIndicateurChartLine[] =>
  entries.map(({ node, resultatByDate, objectifByDate }) => ({
    indicateurId: node.id,
    label: node.label,
    color: colorOf(node.id),
    resultatValeurs: alignOnDatesOrNull({
      dates,
      valeurByDate: resultatByDate,
    }),
    objectifValeurs: alignOnDatesOrNull({
      dates,
      valeurByDate: objectifByDate,
    }),
  }));

const alignOnDatesOrNull = ({
  dates,
  valeurByDate,
}: {
  dates: readonly string[];
  valeurByDate: ValeurByDate;
}): SousIndicateurChartValeurs | null =>
  valeurByDate.size === 0 ? null : alignOnDates({ dates, valeurByDate });

const hasResultat = ({ resultatByDate }: NodeValeurs): boolean =>
  resultatByDate.size > 0;

const hasResultatOrObjectif = ({
  resultatByDate,
  objectifByDate,
}: NodeValeurs): boolean => resultatByDate.size > 0 || objectifByDate.size > 0;

const isLeaf = ({ enfantIds }: SousIndicateurNode): boolean =>
  enfantIds.length === 0;

const toNodeValeurByDate = ({
  node,
  source,
  field,
}: {
  node: SousIndicateurNode;
  source: SousIndicateursSource;
  field: ChartField;
}): ValeurByDate => {
  if (isLeaf(node)) {
    return toValeurByDateFromValeurs({
      valeurs: source.valeursByIndicateurId.get(node.id) ?? [],
      field,
    });
  }
  return toValeurByDateFromTotals({
    totals: source.totalsByIndicateurId.get(node.id) ?? [],
    field,
  });
};

const toNodeValeurs =
  (source: SousIndicateursSource) =>
  (node: SousIndicateurNode): NodeValeurs => ({
    node,
    resultatByDate: toNodeValeurByDate({ node, source, field: 'resultat' }),
    objectifByDate: toNodeValeurByDate({ node, source, field: 'objectif' }),
  });

const listRootChildNodes = ({
  rootId,
  source,
}: {
  rootId: number;
  source: SousIndicateursSource;
}): SousIndicateurNode[] | null => {
  const root = source.nodesById.get(rootId);
  if (root === undefined) {
    return null;
  }
  return listChildNodes({
    enfantIds: root.enfantIds,
    visitedIds: new Set([rootId]),
    nodesById: source.nodesById,
  });
};

const listRootTotals = ({
  rootId,
  source,
}: {
  rootId: number;
  source: SousIndicateursSource;
}): readonly IndicateurTotalAtDate[] =>
  source.totalsByIndicateurId.get(rootId) ?? [];

const listLeaves = ({
  nodes,
  visitedIds,
  nodesById,
}: {
  nodes: readonly SousIndicateurNode[];
  visitedIds: ReadonlySet<number>;
  nodesById: ReadonlyMap<number, SousIndicateurNode>;
}): SousIndicateurNode[] =>
  nodes.flatMap((node) => {
    if (isLeaf(node)) {
      return [node];
    }
    const descendantVisitedIds = new Set([...visitedIds, node.id]);
    return listLeaves({
      nodes: listChildNodes({
        enfantIds: node.enfantIds,
        visitedIds: descendantVisitedIds,
        nodesById,
      }),
      visitedIds: descendantVisitedIds,
      nodesById,
    });
  });

const buildStackedData = ({
  rootId,
  source,
  colorOf,
}: {
  rootId: number;
  source: SousIndicateursSource;
  colorOf: (indicateurId: number) => string;
}): SousIndicateursChartData | null => {
  const rootChildNodes = listRootChildNodes({ rootId, source });
  if (rootChildNodes === null) {
    return null;
  }
  const leafEntries = uniqBy(
    listLeaves({
      nodes: rootChildNodes,
      visitedIds: new Set([rootId]),
      nodesById: source.nodesById,
    }),
    ({ id }) => id
  )
    .map(toNodeValeurs(source))
    .filter(hasResultat);
  const rootTotals = listRootTotals({ rootId, source });
  const resultatTotal = toValeurByDateFromTotals({
    totals: rootTotals,
    field: 'resultat',
  });
  const objectifTotal = toValeurByDateFromTotals({
    totals: rootTotals,
    field: 'objectif',
  });
  const dates = listDates([
    ...leafEntries.map(({ resultatByDate }) => resultatByDate),
    resultatTotal,
    objectifTotal,
  ]);
  if (dates.length === 0) {
    return null;
  }
  return {
    mode: 'stacked',
    dates,
    leaves: toSeries({ entries: leafEntries, dates, colorOf }),
    resultatTotal: alignOnDatesOrNull({ dates, valeurByDate: resultatTotal }),
    objectifTotal: alignOnDatesOrNull({ dates, valeurByDate: objectifTotal }),
  };
};

const buildLinesData = ({
  rootId,
  source,
  colorOf,
}: {
  rootId: number;
  source: SousIndicateursSource;
  colorOf: (indicateurId: number) => string;
}): SousIndicateursChartData | null => {
  const rootChildNodes = listRootChildNodes({ rootId, source });
  if (rootChildNodes === null) {
    return null;
  }
  const entries = rootChildNodes
    .map(toNodeValeurs(source))
    .filter(hasResultatOrObjectif);
  const dates = listDates(
    entries.flatMap(({ resultatByDate, objectifByDate }) => [
      resultatByDate,
      objectifByDate,
    ])
  );
  if (dates.length === 0) {
    return null;
  }
  return {
    mode: 'lines',
    dates,
    lines: toLines({ entries, dates, colorOf }),
  };
};

export const buildSousIndicateursChartData = ({
  rootId,
  ...source
}: SousIndicateursSource &
  Readonly<{ rootId: number }>): SousIndicateursChartData | null => {
  const colorOf = toSousIndicateurColorOf(
    listSousIndicateurIdsInTableOrder({ rootId, nodesById: source.nodesById })
  );
  return hasNotAdditiveObjectif(listRootTotals({ rootId, source }))
    ? buildLinesData({ rootId, source, colorOf })
    : buildStackedData({ rootId, source, colorOf });
};
