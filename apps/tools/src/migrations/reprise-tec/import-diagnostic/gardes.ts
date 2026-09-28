/** Les gardes : tout ce qui peut arrêter l'import, rassemblé en un seul endroit. */

import { PoolClient } from 'pg';
import type { LigneDiagnostic } from './tables-grille';
import type { Dossiers } from './dossiers';
import { listCasBloquantsEcriture } from './ecriture';
import { listCasBloquantsGrille } from './emplacement';

/** Arrête l'import avant toute écriture si une garde trouve un cas ; liste tous les cas d'un coup. */
export const validateGardes = async (
  client: PoolClient,
  dossiers: Dossiers,
  lignes: readonly LigneDiagnostic[]
) => {
  const cas = [
    ...dossiers.listCasBloquants(),
    ...listCasBloquantsGrille(lignes),
    ...(await listCasBloquantsEcriture(client)),
  ];
  if (cas.length > 0) {
    throw new Error(
      `L'import est arrêté avant toute écriture, ${cas.length} cas :\n` +
        cas.join('\n')
    );
  }
};
