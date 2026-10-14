import type { PersistedCollectionPersistence } from '@tanstack/browser-db-sqlite-persistence';

const DATABASE_NAME = 'tet-referentiels';

/**
 * Ouvre la persistance SQLite (OPFS) des définitions d'actions. À n'appeler
 * qu'une fois, côté navigateur (voir `useActionDefinitionsCollection`).
 *
 * Renvoie `null` si le navigateur ne permet pas OPFS (navigation privée,
 * navigateur ancien…) : la collection fonctionne alors en mémoire seulement.
 */
export async function openActionDefinitionsPersistence(): Promise<PersistedCollectionPersistence | null> {
  try {
    // import dynamique : le module (et son worker wa-sqlite) n'est chargé
    // qu'au premier besoin, jamais côté serveur
    const {
      BrowserCollectionCoordinator,
      createBrowserWASQLitePersistence,
      openBrowserWASQLiteOPFSDatabase,
    } = await import('@tanstack/browser-db-sqlite-persistence');

    const database = await openBrowserWASQLiteOPFSDatabase({
      databaseName: `${DATABASE_NAME}.sqlite`,
    });

    // plusieurs onglets partagent la même base OPFS : le coordinateur élit un
    // onglet « écrivain » et diffuse les écritures aux autres
    const coordinator = new BrowserCollectionCoordinator({
      dbName: DATABASE_NAME,
    });

    return createBrowserWASQLitePersistence({ database, coordinator });
  } catch (error) {
    console.warn(
      'Persistance locale des référentiels indisponible, repli en mémoire',
      error
    );
    return null;
  }
}
