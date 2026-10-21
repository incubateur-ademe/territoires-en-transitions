import type { QueryClient } from '@tanstack/react-query';
import type { AppRouter } from '@tet/api';
import { ReferentielId } from '@tet/domain/referentiels';
import type { TRPCOptionsProxy } from '@trpc/tanstack-react-query';
import {
  ActionDefinitionsCollection,
  replaceReferentielDefinitions,
} from './action-definitions.collection';

/**
 * Définitions à (re)charger pour un référentiel, d'après la version stockée
 * localement et la version publiée renvoyée avec l'état de la collectivité.
 * `null` si les définitions stockées sont à jour (ou si on ne sait pas encore).
 */
export function getDefinitionsSyncKey({
  referentielId,
  storedVersion,
  publishedVersion,
}: {
  referentielId: ReferentielId;
  storedVersion: string | undefined;
  publishedVersion: string | undefined;
}): string | null {
  if (storedVersion === undefined) {
    // rien en local : chargement initial, sans attendre l'état
    return `${referentielId}:vide`;
  }
  if (publishedVersion !== undefined && publishedVersion !== storedVersion) {
    return `${referentielId}:${storedVersion}:${publishedVersion}`;
  }
  return null;
}

/**
 * Charge les définitions d'un référentiel et les écrit dans la collection
 * (persistée). Renvoie la version chargée.
 *
 * Si la version obtenue diffère encore de la version publiée annoncée par
 * l'état, l'état est rechargé (une nouvelle version a été publiée entre les
 * deux chargements) : les deux parties lisent la même table et convergent.
 *
 * `onWriteError` est appelé si l'écriture dans la collection échoue (erreur
 * de la persistance locale), avant que l'erreur soit relancée.
 */
export async function syncReferentielDefinitions({
  referentielId,
  publishedVersion,
  collection,
  queryClient,
  trpc,
  onWriteError,
}: {
  referentielId: ReferentielId;
  publishedVersion: string | undefined;
  collection: ActionDefinitionsCollection;
  queryClient: QueryClient;
  trpc: TRPCOptionsProxy<AppRouter>;
  onWriteError?: (error: unknown) => void;
}): Promise<string> {
  const definitions = await queryClient.fetchQuery({
    ...trpc.referentiels.actions.listActionDefinitions.queryOptions({
      referentielId,
    }),
    // la réponse n'a pas besoin de rester dans le cache Query : elle vit
    // désormais dans la collection
    staleTime: 0,
    gcTime: 0,
  });

  try {
    await replaceReferentielDefinitions(collection, referentielId, definitions);
  } catch (error) {
    onWriteError?.(error);
    throw error;
  }

  if (
    publishedVersion !== undefined &&
    definitions.referentielVersion !== publishedVersion
  ) {
    await queryClient.invalidateQueries({
      ...trpc.referentiels.actions.listActionsGroupedById.queryFilter({
        referentielId,
      }),
      refetchType: 'all',
    });
  }

  return definitions.referentielVersion;
}
