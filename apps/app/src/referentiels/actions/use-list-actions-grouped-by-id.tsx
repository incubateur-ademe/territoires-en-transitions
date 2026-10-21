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
  ReferentielId,
} from '@tet/domain/referentiels';
import { useCallback, useEffect } from 'react';
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

/**
 * Liste les actions des référentiels demandés, en fusionnant pour chacun :
 * - les définitions (partie statique, partagée entre collectivités et chargée
 *   une fois par session) ;
 * - l'état de la collectivité (scores, pilotes, services, généalogie),
 *   rechargé après chaque écriture.
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
  const combine = useCallback(
    (results: QueryObserverResult<unknown, unknown>[]) => {
      const ids = (
        referentielIdsKey ? referentielIdsKey.split(',') : []
      ) as ReferentielId[];

      const { versionMismatches, ...merged } = mergeActionsQueryResults(
        ids.map((referentielId, i) => ({
          referentielId,
          definitions: results[
            2 * i
          ] as ActionsQueryPart<ListActionDefinitionsOutput>,
          state: results[
            2 * i + 1
          ] as ActionsQueryPart<ListActionsDynamicStateResult>,
        }))
      );

      return {
        ...merged,
        // clé stable (chaîne) pour les dépendances de l'effet ci-dessous
        versionMismatchesKey: versionMismatches
          .map(getVersionMismatchKey)
          .join(','),
      };
    },
    [referentielIdsKey]
  );

  const { versionMismatchesKey, ...result } = useQueries({
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
    combine,
  });

  // Écart de version entre les deux parties d'un référentiel : les deux sont
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
    }
  }, [versionMismatchesKey, queryClient, trpc]);

  return result;
}
