/** Les gardes : tout ce qui peut arrêter l'import, rassemblé en un seul endroit. */

import type { Dossiers } from './dossiers';
import { listCasBloquantsServices, type Saisine } from './services';

/** Arrête avant toute écriture si une garde trouve un cas ; liste tous les cas d'un coup. */
export const validateGardes = (
  dossiers: Dossiers,
  saisines: readonly Saisine[],
  dateDuJour: string
) => {
  const cas = [
    ...dossiers.listCasBloquants(dateDuJour),
    ...listCasBloquantsServices(dossiers.transmis, saisines),
  ];
  if (cas.length > 0) {
    throw new Error(
      `L'import est arrêté avant toute écriture, ${cas.length} cas :\n` +
        cas.join('\n')
    );
  }
};
