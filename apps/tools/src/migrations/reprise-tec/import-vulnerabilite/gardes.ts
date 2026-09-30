/** Les gardes : tout ce qui peut arrêter l'import, rassemblé en un seul endroit. */

import { PoolClient } from 'pg';
import { listCasBloquantsEcriture } from './ecriture';
import { listCasBloquantsDossiers } from './lignes';
import { listCasBloquantsSocle } from './thematiques';

/** Arrête avant toute écriture si une garde trouve un cas ; liste tous les cas d'un coup. */
export const validateGardes = async (
  client: PoolClient,
  socle: ReadonlyMap<string, number>
) => {
  const cas = [
    ...(await listCasBloquantsDossiers(client)),
    ...(await listCasBloquantsEcriture(client)),
    ...listCasBloquantsSocle(socle),
  ];
  if (cas.length > 0) {
    throw new Error(
      `L'import est arrêté avant toute écriture, ${cas.length} cas :\n` +
        cas.join('\n')
    );
  }
};
