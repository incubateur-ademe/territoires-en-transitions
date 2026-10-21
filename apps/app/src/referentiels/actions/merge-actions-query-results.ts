import { AppRouter } from '@tet/api';
import {
  ListActionDefinitionsOutput,
  ListActionsDynamicStateResult,
  ListActionsGroupedByIdResult,
  ListActionTextOverridesOutput,
  mergeActionDefinitionsAndState,
  ReferentielId,
} from '@tet/domain/referentiels';
import { TRPCClientErrorLike } from '@trpc/client';

export type ActionsQueryError = TRPCClientErrorLike<AppRouter>;

/** Sous-ensemble utile du résultat d'une query React Query */
export type ActionsQueryPart<TData> = {
  data: TData | undefined;
  error: ActionsQueryError | null;
  isFetching: boolean;
  isPending: boolean;
  isError: boolean;
  refetch: () => Promise<unknown>;
};

export type ActionsQueryFailure = {
  error: ActionsQueryError;
  retry: () => void;
};

/**
 * Résultats des queries d'un référentiel : définitions, état, et surcharges
 * de texte (seulement si l'état donne une clé de variante)
 */
export type ActionsQueryResultsPair = {
  referentielId: ReferentielId;
  definitions: ActionsQueryPart<ListActionDefinitionsOutput>;
  state: ActionsQueryPart<ListActionsDynamicStateResult>;
  textOverrides?: ActionsQueryPart<ListActionTextOverridesOutput>;
};

/**
 * Deux parties d'un référentiel ont été servies pour des versions publiées
 * différentes (une nouvelle version a été publiée entre les chargements).
 * `stateVersion` : version de l'état, ou des surcharges de texte qui en
 * découlent.
 */
export type ReferentielVersionMismatch = {
  referentielId: ReferentielId;
  definitionsVersion: string;
  stateVersion: string;
};

export type MergedActionsQueryResults = {
  data: Map<ReferentielId, ListActionsGroupedByIdResult>;
  isPending: boolean;
  failure: ActionsQueryFailure | undefined;
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

/** Tient lieu de surcharges absentes (profil de référence) dans le cache */
const NO_TEXT_OVERRIDES = {};

/**
 * Fusions déjà calculées, par (définitions, état, surcharges) : tant qu'aucune
 * des queries n'est rechargée, les consommateurs reçoivent la même référence.
 */
const mergedByDefinitions = new WeakMap<
  ListActionDefinitionsOutput,
  WeakMap<
    ListActionsDynamicStateResult,
    WeakMap<object, ListActionsGroupedByIdResult>
  >
>();

function getOrCreate<K extends object, V>(
  map: WeakMap<K, V>,
  key: K,
  create: () => V
): V {
  let value = map.get(key);
  if (!value) {
    value = create();
    map.set(key, value);
  }
  return value;
}

function mergeMemoized(
  definitions: ListActionDefinitionsOutput,
  state: ListActionsDynamicStateResult,
  textOverrides: ListActionTextOverridesOutput | undefined
): ListActionsGroupedByIdResult {
  const mergedByState = getOrCreate(
    mergedByDefinitions,
    definitions,
    () => new WeakMap()
  );
  const mergedByTextOverrides = getOrCreate(
    mergedByState,
    state,
    () => new WeakMap()
  );
  return getOrCreate(
    mergedByTextOverrides,
    textOverrides ?? NO_TEXT_OVERRIDES,
    () => mergeActionDefinitionsAndState(definitions, state, textOverrides)
  );
}

/**
 * Fusionne, pour chaque référentiel, les résultats des queries de définitions,
 * d'état et de surcharges de texte, et signale les écarts de version publiée
 * entre les parties.
 *
 * Quand l'état donne une clé de variante, le référentiel n'est fusionné
 * qu'une fois les surcharges chargées : on n'affiche jamais le texte par
 * défaut à la place du texte de la collectivité.
 */
export function mergeActionsQueryResults(
  pairs: ActionsQueryResultsPair[]
): MergedActionsQueryResults {
  const data = new Map<ReferentielId, ListActionsGroupedByIdResult>();
  const versionMismatches: ReferentielVersionMismatch[] = [];
  const parts: ActionsQueryPart<unknown>[] = [];

  for (const { referentielId, definitions, state, textOverrides } of pairs) {
    parts.push(definitions, state);
    // sans clé de variante, la query des surcharges est désactivée : elle ne
    // compte ni pour le chargement ni pour les erreurs
    const needsTextOverrides = Boolean(state.data?.textVariantKey);
    if (needsTextOverrides) {
      parts.push(
        textOverrides ?? {
          data: undefined,
          isFetching: false,
          isPending: true,
          isError: false,
        }
      );
    }

    if (
      !definitions.data ||
      !state.data ||
      (needsTextOverrides && !textOverrides?.data)
    ) {
      continue;
    }

    data.set(
      referentielId,
      mergeMemoized(
        definitions.data,
        state.data,
        needsTextOverrides ? textOverrides?.data : undefined
      )
    );

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
    } else if (
      needsTextOverrides &&
      textOverrides?.data &&
      textOverrides.data.referentielVersion !==
        definitions.data.referentielVersion &&
      !definitions.isFetching &&
      !textOverrides.isFetching
    ) {
      // les surcharges sont demandées pour la version de l'état : un écart
      // avec les définitions se traite comme un écart définitions / état
      versionMismatches.push({
        referentielId,
        definitionsVersion: definitions.data.referentielVersion,
        stateVersion: textOverrides.data.referentielVersion,
      });
    }
  }

  return {
    data,
    isPending: parts.some((part) => part.isPending),
    failure: getFailure(parts),
    versionMismatches,
  };
}

function getFailure(
  parts: ActionsQueryPart<unknown>[]
): ActionsQueryFailure | undefined {
  const failedParts = parts.filter(
    (part) => part.isError && part.data === undefined
  );
  const firstError = failedParts.find((part) => part.error)?.error;
  if (!firstError) {
    return undefined;
  }

  return {
    error: firstError,
    retry: () => failedParts.forEach((part) => void part.refetch()),
  };
}
