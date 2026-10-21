import {
  QueryObserverResult,
  useQueries,
  useQueryClient,
} from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { DISABLE_AUTO_REFETCH } from '@tet/api/utils/react-query/query-options';
import {
  ListActionDefinitionsOutput,
  ListActionsDynamicStateResult,
  ListActionsGroupedByIdResult,
  ListActionTextOverridesOutput,
  ReferentielId,
} from '@tet/domain/referentiels';
import { useEffect, useMemo } from 'react';
import {
  ActionsQueryPart,
  getVersionMismatchKey,
  mergeActionsQueryResults,
} from './merge-actions-query-results';

export type ActionsGroupedByIdData = ListActionsGroupedByIdResult;

/**
 * Écarts de version déjà traités, partagés entre toutes les instances du hook :
 * chaque écart ne déclenche qu'un seul rechargement.
 */
const handledVersionMismatchKeys = new Set<string>();

/** Ne garde que les champs utiles d'un résultat de query */
function toQueryPart<TData>(
  result: QueryObserverResult<unknown, unknown>
): ActionsQueryPart<TData> {
  return {
    data: result.data as TData | undefined,
    isFetching: result.isFetching,
    isPending: result.isPending,
    isError: result.isError,
  };
}

function combineQueryParts(results: QueryObserverResult<unknown, unknown>[]) {
  return results.map((result) => toQueryPart<unknown>(result));
}

/**
 * Liste les actions des référentiels demandés, en fusionnant pour chacun :
 * - les définitions (partie statique, partagée entre collectivités et chargée
 *   une fois par session) ;
 * - l'état de la collectivité (scores, pilotes, services, généalogie),
 *   rechargé après chaque écriture ;
 * - les textes propres au profil de la collectivité (par ex. DOM), chargés
 *   une fois par session et par profil, seulement si l'état en donne la clé.
 */
export function useListActionsGroupedById(
  {
    referentielIds,
    collectiviteId,
  }: {
    referentielIds: ReferentielId[];
    collectiviteId?: number;
  },
  { enabled }: { enabled?: boolean } = { enabled: true }
) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const collectiviteIdFromContext = useCollectiviteId();
  const resolvedCollectiviteId = collectiviteId ?? collectiviteIdFromContext;

  const referentielIdsKey = referentielIds.join(',');

  // les résultats arrivent par paire : [définitions, état] pour chaque référentiel
  const definitionsAndStates = useQueries({
    queries: referentielIds.flatMap((referentielId) => [
      trpc.referentiels.actions.listActionDefinitions.queryOptions(
        { referentielId },
        { enabled, staleTime: Infinity, gcTime: Infinity }
      ),
      trpc.referentiels.actions.listActionsGroupedById.queryOptions(
        { referentielId, collectiviteId: resolvedCollectiviteId },
        { enabled, ...DISABLE_AUTO_REFETCH }
      ),
    ]),
    combine: combineQueryParts,
  });

  // surcharges de texte : clé et version lues dans l'état, donc relancées
  // d'elles-mêmes quand l'état change de version ou de profil
  const textOverrides = useQueries({
    queries: referentielIds.map((referentielId, i) => {
      const state = definitionsAndStates[2 * i + 1]?.data as
        | ListActionsDynamicStateResult
        | undefined;
      return trpc.referentiels.actions.listActionTextOverrides.queryOptions(
        {
          referentielId,
          referentielVersion: state?.referentielVersion ?? '',
          textVariantKey: state?.textVariantKey ?? '',
        },
        {
          enabled: Boolean(enabled && state?.textVariantKey),
          staleTime: Infinity,
          gcTime: Infinity,
        }
      );
    }),
    combine: combineQueryParts,
  });

  const { versionMismatchesKey, ...result } = useMemo(() => {
    const ids = (
      referentielIdsKey ? referentielIdsKey.split(',') : []
    ) as ReferentielId[];

    const { versionMismatches, ...merged } = mergeActionsQueryResults(
      ids.map((referentielId, i) => ({
        referentielId,
        definitions: definitionsAndStates[
          2 * i
        ] as ActionsQueryPart<ListActionDefinitionsOutput>,
        state: definitionsAndStates[
          2 * i + 1
        ] as ActionsQueryPart<ListActionsDynamicStateResult>,
        textOverrides: textOverrides[
          i
        ] as ActionsQueryPart<ListActionTextOverridesOutput>,
      }))
    );

    return {
      ...merged,
      // clé stable (chaîne) pour les dépendances de l'effet ci-dessous
      versionMismatchesKey: versionMismatches
        .map(getVersionMismatchKey)
        .join(','),
    };
  }, [referentielIdsKey, definitionsAndStates, textOverrides]);

  // Écart de version entre les parties d'un référentiel : toutes sont
  // rechargées (elles lisent la version publiée dans la même table et
  // convergent donc), une seule fois par écart quel que soit le nombre
  // d'instances du hook.
  useEffect(() => {
    if (!versionMismatchesKey) {
      return;
    }
    for (const versionMismatchKey of versionMismatchesKey.split(',')) {
      if (handledVersionMismatchKeys.has(versionMismatchKey)) {
        continue;
      }
      handledVersionMismatchKeys.add(versionMismatchKey);

      const [referentielId] = versionMismatchKey.split(':') as [ReferentielId];
      // La clé n'est jamais retirée : l'écart n'est plus signalé pendant le
      // rechargement puis réapparaît s'il persiste (échec, données
      // incohérentes) ; la retirer relancerait les rechargements en boucle.
      queryClient.invalidateQueries(
        trpc.referentiels.actions.listActionDefinitions.queryFilter({
          referentielId,
        })
      );
      // toutes collectivités confondues : l'écart est dédoublonné entre les
      // instances du hook, quelle que soit leur collectivité
      queryClient.invalidateQueries(
        trpc.referentiels.actions.listActionsGroupedById.queryFilter({
          referentielId,
        })
      );
      queryClient.invalidateQueries(
        trpc.referentiels.actions.listActionTextOverrides.queryFilter({
          referentielId,
        })
      );
    }
  }, [versionMismatchesKey, queryClient, trpc]);

  return result;
}
