import type {
  IndicateurTotal,
  IndicateurTotalAtDate,
} from '@tet/domain/indicateurs';
import { uniq } from 'es-toolkit';
import { toSousIndicateurColorOf } from './sous-indicateurs-colors';
import {
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

export type SousIndicateursChartData = Readonly<{
  dates: readonly string[];
  children: readonly SousIndicateurChartSerie[];
  resultatTotal: SousIndicateurChartValeurs | null;
  objectifTotal: SousIndicateurChartValeurs | null;
}>;

type ChartField = 'resultat' | 'objectif';

type NodeValeurs = Readonly<{
  node: SousIndicateurNode;
  resultatByDate: ValeurByDate;
  objectifByDate: ValeurByDate;
  observedDates: readonly string[];
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

const listObservedDates = ({
  dates,
  observedDates,
}: {
  dates: readonly string[];
  observedDates: readonly string[];
}): string[] =>
  dates.length === 0 ? [] : uniq([...dates, ...observedDates]).sort();

const alignOnDates = ({
  dates,
  valeurByDate,
}: {
  dates: readonly string[];
  valeurByDate: ValeurByDate;
}): SousIndicateurChartValeurs =>
  dates.map((date) => valeurByDate.get(date) ?? null);

const toDistinctLabels = (labels: readonly string[]): string[] =>
  labels.map((label, index) => {
    const occurrence = labels
      .slice(0, index + 1)
      .filter((candidate) => candidate === label).length;
    return occurrence === 1 ? label : `${label} (${occurrence})`;
  });

const toSeries = ({
  entries,
  dates,
  colorOf,
}: {
  entries: readonly NodeValeurs[];
  dates: readonly string[];
  colorOf: (indicateurId: number) => string;
}): SousIndicateurChartSerie[] =>
  entries.map(({ node, resultatByDate }, index) => ({
    indicateurId: node.id,
    label: toDistinctLabels(entries.map((entry) => entry.node.label))[index],
    color: colorOf(node.id),
    valeurs: alignOnDates({ dates, valeurByDate: resultatByDate }),
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

const toNodeObservedDates = ({
  node,
  source,
}: {
  node: SousIndicateurNode;
  source: SousIndicateursSource;
}): string[] =>
  isLeaf(node)
    ? (source.valeursByIndicateurId.get(node.id) ?? []).map(
        ({ dateValeur }) => dateValeur
      )
    : (source.totalsByIndicateurId.get(node.id) ?? []).map(
        ({ dateValeur }) => dateValeur
      );

const toNodeValeurs =
  (source: SousIndicateursSource) =>
  (node: SousIndicateurNode): NodeValeurs => ({
    node,
    resultatByDate: toNodeValeurByDate({ node, source, field: 'resultat' }),
    objectifByDate: toNodeValeurByDate({ node, source, field: 'objectif' }),
    observedDates: toNodeObservedDates({ node, source }),
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
  const childEntries = rootChildNodes
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
  const traceableDates = listDates([
    ...childEntries.map(({ resultatByDate }) => resultatByDate),
    resultatTotal,
    objectifTotal,
  ]);
  if (traceableDates.length === 0) {
    return null;
  }
  const dates = listObservedDates({
    dates: traceableDates,
    observedDates: [
      ...childEntries.flatMap(({ observedDates }) => observedDates),
      ...rootTotals.map(({ dateValeur }) => dateValeur),
    ],
  });
  return {
    dates,
    children: toSeries({ entries: childEntries, dates, colorOf }),
    resultatTotal: alignOnDatesOrNull({ dates, valeurByDate: resultatTotal }),
    objectifTotal: alignOnDatesOrNull({ dates, valeurByDate: objectifTotal }),
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
  return buildStackedData({ rootId, source, colorOf });
};
