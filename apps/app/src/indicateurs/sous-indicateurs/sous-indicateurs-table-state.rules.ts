import {
  COLLECTIVITE_SOURCE_ID,
  type IndicateurTotalAtDate,
} from '@tet/domain/indicateurs';
import type { ListIndicateurValeurOuput } from '../valeurs/use-list-indicateur-valeurs';
import {
  buildSousIndicateursTableData,
  type SousIndicateurDatedValeur,
  type SousIndicateurNode,
  type SousIndicateursSource,
  type SousIndicateursTableData,
} from './sous-indicateurs-table.rules';

export type SousIndicateursNotReadyState =
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'error' }>;

export type SousIndicateursSourceState =
  | SousIndicateursNotReadyState
  | Readonly<{
      status: 'ready';
      collectiviteId: number;
      source: SousIndicateursSource;
    }>;

export type SousIndicateursTableState =
  | SousIndicateursNotReadyState
  | Readonly<{
      status: 'ready';
      collectiviteId: number;
      data: SousIndicateursTableData;
    }>;

export type QueryOutcome<Data> =
  | Readonly<{ status: 'pending' }>
  | Readonly<{ status: 'error' }>
  | Readonly<{ status: 'success'; data: Data }>;

export type ParentTotals = Readonly<{
  indicateurId: number;
  totals: readonly IndicateurTotalAtDate[];
}>;

export type ValeursIndicateurs = ListIndicateurValeurOuput['indicateurs'];

export type SousIndicateursOutcomes = Readonly<{
  collectiviteId: number;
  nodes: QueryOutcome<readonly SousIndicateurNode[]>;
  valeurs: QueryOutcome<ValeursIndicateurs>;
  totals: QueryOutcome<readonly ParentTotals[]>;
}>;

const NO_VALEURS: ValeursIndicateurs = [];

export const toQueryOutcome = <Data>({
  isError,
  data,
}: {
  isError: boolean;
  data: Data | undefined;
}): QueryOutcome<Data> => {
  if (isError) {
    return { status: 'error' };
  }
  if (data === undefined) {
    return { status: 'pending' };
  }
  return { status: 'success', data };
};

export const toTotalsOutcome = (
  results: readonly Readonly<{
    isError: boolean;
    data: ParentTotals | undefined;
  }>[]
): QueryOutcome<readonly ParentTotals[]> => {
  const hasError = results.some(({ isError }) => isError);
  if (hasError) {
    return { status: 'error' };
  }
  const parentTotals = results.flatMap(({ data }) =>
    data === undefined ? [] : [data]
  );
  const isStillLoading = parentTotals.length < results.length;
  if (isStillLoading) {
    return { status: 'pending' };
  }
  return { status: 'success', data: parentTotals };
};

export const toValeursByIndicateurId = (
  indicateurs: ValeursIndicateurs
): ReadonlyMap<number, readonly SousIndicateurDatedValeur[]> =>
  new Map(
    indicateurs.map(({ definition, sources }) => [
      definition.id,
      (sources[COLLECTIVITE_SOURCE_ID]?.valeurs ?? []).map(
        ({ dateValeur, resultat, objectif }) => ({
          dateValeur,
          resultat: resultat ?? null,
          objectif: objectif ?? null,
        })
      ),
    ])
  );

export const toSousIndicateursSourceState = ({
  indicateurId,
  collectiviteId,
  nodes,
  valeurs,
  totals,
}: SousIndicateursOutcomes &
  Readonly<{ indicateurId: number }>): SousIndicateursSourceState => {
  if (
    nodes.status === 'error' ||
    valeurs.status === 'error' ||
    totals.status === 'error'
  ) {
    return { status: 'error' };
  }
  if (nodes.status === 'pending') {
    return { status: 'loading' };
  }
  const hasDescendants = nodes.data.some(({ id }) => id !== indicateurId);
  const resolvedValeurs: QueryOutcome<ValeursIndicateurs> = hasDescendants
    ? valeurs
    : { status: 'success', data: NO_VALEURS };
  const isStillLoading =
    resolvedValeurs.status === 'pending' || totals.status === 'pending';
  if (isStillLoading) {
    return { status: 'loading' };
  }
  return {
    status: 'ready',
    collectiviteId,
    source: {
      nodesById: new Map(nodes.data.map((node) => [node.id, node])),
      valeursByIndicateurId: toValeursByIndicateurId(resolvedValeurs.data),
      totalsByIndicateurId: new Map(
        totals.data.map((parentTotals) => [
          parentTotals.indicateurId,
          parentTotals.totals,
        ])
      ),
    },
  };
};

export const toSousIndicateursTableState = ({
  indicateurId,
  ...queries
}: SousIndicateursOutcomes &
  Readonly<{
    indicateurId: number;
  }>): SousIndicateursTableState => {
  const sourceState = toSousIndicateursSourceState({
    indicateurId,
    ...queries,
  });
  if (sourceState.status !== 'ready') {
    return sourceState;
  }
  return {
    status: 'ready',
    collectiviteId: sourceState.collectiviteId,
    data: buildSousIndicateursTableData({
      rootId: indicateurId,
      ...sourceState.source,
    }),
  };
};
