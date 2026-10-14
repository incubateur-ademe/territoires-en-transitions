import type { PersistedCollectionPersistence } from '@tanstack/browser-db-sqlite-persistence';
import { persistedCollectionOptions } from '@tanstack/browser-db-sqlite-persistence';
import {
  BasicIndex,
  Collection,
  createCollection,
  createTransaction,
  localOnlyCollectionOptions,
  LocalOnlyCollectionUtils,
} from '@tanstack/react-db';
import {
  ActionId,
  ActionStaticDefinition,
  ListActionDefinitionsOutput,
  ReferentielId,
} from '@tet/domain/referentiels';

/**
 * À incrémenter à chaque changement de forme de `ActionStaticDefinition` :
 * les définitions persistées sont alors effacées puis rechargées.
 */
const SCHEMA_VERSION = 1;

const COLLECTION_ID = 'action-definitions';

export type ActionDefinitionsCollection = Collection<
  ActionStaticDefinition,
  ActionId,
  LocalOnlyCollectionUtils
>;

/**
 * Définitions des actions de tous les référentiels (partie statique, publique
 * et indépendante de la collectivité), clé `actionId`.
 *
 * Collection locale : elle ne se synchronise pas d'elle-même. Elle est
 * alimentée par `replaceReferentielDefinitions` quand elle est vide ou que la
 * version publiée d'un référentiel a changé. Avec `persistence`, son contenu
 * survit aux rechargements de page (SQLite OPFS) ; sans, elle reste en mémoire.
 */
export function createActionDefinitionsCollection(
  persistence: PersistedCollectionPersistence | null
): ActionDefinitionsCollection {
  const getKey = (definition: ActionStaticDefinition) => definition.actionId;
  // index créés à la demande pour la jointure et les filtres des live queries
  const indexing = {
    autoIndex: 'eager',
    defaultIndexType: BasicIndex,
  } as const;

  if (!persistence) {
    return createCollection(
      localOnlyCollectionOptions<ActionStaticDefinition, ActionId>({
        id: COLLECTION_ID,
        getKey,
        ...indexing,
      })
    );
  }

  return createCollection(
    persistedCollectionOptions<ActionStaticDefinition, ActionId>({
      id: COLLECTION_ID,
      getKey,
      ...indexing,
      persistence,
      schemaVersion: SCHEMA_VERSION,
    })
  ) as ActionDefinitionsCollection;
}

/**
 * Remplace, en une transaction, les définitions d'un référentiel par celles
 * renvoyées par `listActionDefinitions` : ajout des nouvelles, mise à jour des
 * existantes, suppression de celles qui ont disparu.
 */
export async function replaceReferentielDefinitions(
  collection: ActionDefinitionsCollection,
  referentielId: ReferentielId,
  { definitionsById }: ListActionDefinitionsOutput
): Promise<void> {
  const existingIds = new Set<ActionId>();
  for (const definition of collection.values()) {
    if (definition.referentielId === referentielId) {
      existingIds.add(definition.actionId);
    }
  }

  const toInsert: ActionStaticDefinition[] = [];
  const toUpdateIds: ActionId[] = [];
  for (const definition of Object.values(definitionsById)) {
    if (existingIds.has(definition.actionId)) {
      toUpdateIds.push(definition.actionId);
    } else {
      toInsert.push(definition);
    }
  }
  const toDelete = [...existingIds].filter(
    (actionId) => !Object.hasOwn(definitionsById, actionId)
  );

  const transaction = createTransaction<ActionStaticDefinition>({
    mutationFn: async ({ transaction }) => {
      // `acceptMutations` est typé pour des lignes `Record<string, unknown>`
      await collection.utils.acceptMutations(
        transaction as unknown as Parameters<
          LocalOnlyCollectionUtils['acceptMutations']
        >[0]
      );
    },
  });

  transaction.mutate(() => {
    if (toDelete.length) {
      collection.delete(toDelete);
    }
    if (toInsert.length) {
      collection.insert(toInsert);
    }
    if (toUpdateIds.length) {
      collection.update(toUpdateIds, (drafts) => {
        for (const draft of drafts) {
          Object.assign(draft, definitionsById[draft.actionId]);
        }
      });
    }
  });

  await transaction.isPersisted.promise;
}
