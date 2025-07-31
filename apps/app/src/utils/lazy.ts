import { ComponentType, lazy as originalLazy } from 'react';

type ImportComponent = () => Promise<{ default: ComponentType<any> }>;

const FORCE_REFRESH = 'force-refresh';

// Encapsule la fonction `React.lazy` pour faire un rechargement complet de la
// page en cas d'erreur de chargement dynamique d'un composant, et ce afin
// d'éviter les `ChunkLoadError` lors des mises à jour du front.
// Ref: https://gist.github.com/raphael-leger/4d703dea6c845788ff9eb36142374bdb#file-lazywithretry-js
export const lazy = (importComponent: ImportComponent) =>
  originalLazy((async () => {
    // vérifie si on a déjà forcé le rechargement complet
    const isPageHasBeenForceRefreshed = JSON.parse(
      localStorage.getItem(FORCE_REFRESH) || 'false'
    );

    try {
      // essaye de charger le composant
      const component = await importComponent();

      localStorage.setItem(FORCE_REFRESH, 'false');

      return component;
    } catch (error) {
      // en cas d'erreur on essaye de faire un rechargement complet de la page
      // si ça n'a pas déjà été tenté
      if (
        (error as Error).name === 'ChunkLoadError' &&
        !isPageHasBeenForceRefreshed
      ) {
        localStorage.setItem(FORCE_REFRESH, 'true');
        return document.location.reload();
      }

      throw error;
    }
  }) as ImportComponent);
