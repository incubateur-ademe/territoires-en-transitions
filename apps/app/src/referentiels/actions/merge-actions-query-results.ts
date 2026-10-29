import {
  ListActionDefinitionsOutput,
  ListActionsDynamicStateResult,
  ListActionsGroupedByIdResult,
  mergeActionDefinitionsAndState,
  ReferentielId,
} from '@tet/domain/referentiels';

/** Sous-ensemble utile du résultat d'une query React Query */
export type ActionsQueryPart<TData> = {
  data: TData | undefined;
  isFetching: boolean;
  isPending: boolean;
  isError: boolean;
};

/** Résultats des deux queries (définitions, état) d'un référentiel */
export type ActionsQueryResultsPair = {
  referentielId: ReferentielId;
  definitions: ActionsQueryPart<ListActionDefinitionsOutput>;
  state: ActionsQueryPart<ListActionsDynamicStateResult>;
};

/**
 * Les deux parties d'un référentiel ont été servies pour des versions publiées
 * différentes (une nouvelle version a été publiée entre les deux chargements).
 */
export type ReferentielVersionMismatch = {
  referentielId: ReferentielId;
  definitionsVersion: string;
  stateVersion: string;
};

export type MergedActionsQueryResults = {
  data: Map<ReferentielId, ListActionsGroupedByIdResult>;
  isPending: boolean;
  isError: boolean;
  versionMismatches: ReferentielVersionMismatch[];
};

/** Clé identifiant un écart de version, pour ne le traiter qu'une fois */
export function getVersionMismatchKey({
  referentielId,
  definitionsVersion,
  stateVersion,
}: ReferentielVersionMismatch): string {
  return `${referentielId}:${definitionsVersion}:${stateVersion}`;
}

/**
 * Fusions déjà calculées, par paire (définitions, état) : tant qu'aucune des
 * deux queries n'est rechargée, les consommateurs reçoivent la même référence.
 */
const mergedByDefinitions = new WeakMap<
  ListActionDefinitionsOutput,
  WeakMap<ListActionsDynamicStateResult, ListActionsGroupedByIdResult>
>();

function mergeMemoized(
  definitions: ListActionDefinitionsOutput,
  state: ListActionsDynamicStateResult
): ListActionsGroupedByIdResult {
  let mergedByState = mergedByDefinitions.get(definitions);
  if (!mergedByState) {
    mergedByState = new WeakMap();
    mergedByDefinitions.set(definitions, mergedByState);
  }

  let merged = mergedByState.get(state);
  if (!merged) {
    merged = mergeActionDefinitionsAndState(definitions, state);
    mergedByState.set(state, merged);
  }
  return merged;
}

/**
 * Fusionne, pour chaque référentiel, les résultats des queries de définitions
 * et d'état, et signale les écarts de version publiée entre les deux parties.
 */
export function mergeActionsQueryResults(
  pairs: ActionsQueryResultsPair[]
): MergedActionsQueryResults {
  const data = new Map<ReferentielId, ListActionsGroupedByIdResult>();
  const versionMismatches: ReferentielVersionMismatch[] = [];

  for (const { referentielId, definitions, state } of pairs) {
    if (!definitions.data || !state.data) {
      continue;
    }

    data.set(referentielId, mergeMemoized(definitions.data, state.data));

    // Une nouvelle version du référentiel a été publiée depuis le chargement
    // de l'une des deux parties (chaque réponse porte la version publiée au
    // moment où elle a été servie). Pas de signalement pendant un
    // rechargement : l'écart peut se résorber de lui-même.
    if (
      definitions.data.referentielVersion !== state.data.referentielVersion &&
      !definitions.isFetching &&
      !state.isFetching
    ) {
      versionMismatches.push({
        referentielId,
        definitionsVersion: definitions.data.referentielVersion,
        stateVersion: state.data.referentielVersion,
      });
    }
  }

  const parts = pairs.flatMap(({ definitions, state }) => [definitions, state]);

  return {
    data,
    isPending: parts.some((part) => part.isPending),
    isError: parts.some((part) => part.isError && part.data === undefined),
    versionMismatches,
  };
}
