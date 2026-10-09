/** Les gardes : tout ce qui peut arrêter l'import, rassemblé en un seul endroit. */

import { PoolClient } from 'pg';
import { listCasBloquantsBibliotheque } from './bibliotheque';
import { listCasBloquantsEcriture } from './ecriture';
import { listCasBloquantsPieces, type Fichier } from './pieces';

/** Arrête avant toute écriture si une garde trouve un cas ; liste tous les cas d'un coup. */
export const validateGardes = async (
  client: PoolClient,
  fichiers: readonly Fichier[]
) => {
  const cas = [
    ...(await listCasBloquantsPieces(client)),
    ...(await listCasBloquantsEcriture(client)),
    ...listCasBloquantsBibliotheque(fichiers),
  ];
  if (cas.length > 0) {
    throw new Error(
      `L'import est arrêté avant toute écriture, ${cas.length} cas :\n` +
        cas.join('\n')
    );
  }
};
