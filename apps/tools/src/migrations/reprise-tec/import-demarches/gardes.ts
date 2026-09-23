/** Les gardes : tout ce qui peut arrêter l'import, rassemblé en un seul endroit. */

import type { Collectivites } from './collectivites';
import type { DemarchesTet } from './demarches-tet';
import { listCasBloquantsDossiers, type Dossier } from './dossier';

/** Arrête avant toute écriture si une garde trouve un cas ; liste tous les cas d'un coup. */
export const validateGardes = (
  dossiers: readonly Dossier[],
  {
    collectivites,
    demarchesTet,
    dateReference,
  }: {
    collectivites: Collectivites;
    demarchesTet: DemarchesTet;
    dateReference: string;
  }
) => {
  const cas = [
    ...collectivites.listCasBloquants(dossiers),
    ...listCasBloquantsDossiers(dossiers, dateReference),
    ...demarchesTet.listCasBloquants(dossiers, collectivites),
  ];
  if (cas.length > 0) {
    throw new Error(
      `L'import est arrêté avant toute écriture, ${cas.length} cas :\n` +
        cas.join('\n')
    );
  }
};
