/** Les gardes : tout ce qui peut arrêter l'import, rassemblé en un seul endroit. */

import { PoolClient } from 'pg';
import { listCasBloquantsDossiers, type Dossier } from './dossiers';
import { listCasBloquantsEcriture } from './ecriture';
import { listCasBloquantsFiches } from './fiches';
import { listCasBloquantsListesTec } from './listes-tec';
import type { ListesTet } from './listes-tet';
import { listCasBloquantsPlans } from './plans';

/** Arrête avant toute écriture si une garde trouve un cas ; liste tous les cas d'un coup. */
export const validateGardes = async (
  client: PoolClient,
  dossiers: readonly Dossier[],
  listesTet: ListesTet
) => {
  const cas = [
    ...listCasBloquantsDossiers(dossiers),
    ...(await listCasBloquantsPlans(client, dossiers)),
    ...(await listCasBloquantsEcriture(client)),
    ...listesTet.listCasBloquants(),
    ...listCasBloquantsListesTec(dossiers),
    ...listCasBloquantsFiches(dossiers),
  ];
  if (cas.length > 0) {
    throw new Error(
      `L'import est arrêté avant toute écriture, ${cas.length} cas :\n` +
        cas.join('\n')
    );
  }
};
