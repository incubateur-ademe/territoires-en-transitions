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
      // les définitions attendent l'ouverture : au-delà, repli en mémoire
      // plutôt que les 30 s par défaut
      timeoutMs: 3000,
    });

    // plusieurs onglets partagent la même base OPFS : le coordinateur élit un
    // onglet « écrivain » et diffuse les écritures aux autres
    const coordinator = new BrowserCollectionCoordinator({
      dbName: DATABASE_NAME,
    });

    // collection locale (sans synchronisation) : par défaut, un changement de
    // `schemaVersion` lèverait une erreur au lieu d'effacer les lignes
    return createBrowserWASQLitePersistence({
      database,
      coordinator,
      schemaMismatchPolicy: 'reset',
    });
  } catch (error) {
    console.warn(
      'Persistance locale des référentiels indisponible, repli en mémoire',
      error
    );
    return null;
  }
}
