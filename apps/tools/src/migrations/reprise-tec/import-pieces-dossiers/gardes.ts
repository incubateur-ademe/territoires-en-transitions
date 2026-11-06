/** Les gardes : tout ce qui peut arrêter l'import, rassemblé en un seul endroit. */

import { PoolClient } from 'pg';
import { listCasBloquantsArchive } from './archive';
import { listCasBloquantsAvis, type buildAvis } from './avis';
import type { Depot } from './bibliotheque';
import { listCasBloquantsEcriture } from './ecriture';
import { listCasBloquantsDossiers } from './fichiers';
import { listCasBloquantsFichiersDesFiches } from './fichiers-des-fiches';
import { listCasBloquantsStockage } from './stockage';

/** Arrête avant tout dépôt et toute écriture si une garde trouve un cas ; liste tous les cas d'un coup. */
export const validateGardes = async (
  client: PoolClient,
  {
    archive,
    avis,
    depots,
  }: {
    archive: string;
    avis: ReturnType<typeof buildAvis>;
    depots: readonly Depot[];
  }
) => {
  const cas = [
    ...(await listCasBloquantsDossiers(client)),
    ...(await listCasBloquantsFichiersDesFiches(client)),
    ...(await listCasBloquantsEcriture(client)),
    ...(await listCasBloquantsArchive(archive)),
    ...(await listCasBloquantsStockage(client, depots)),
    ...listCasBloquantsAvis(avis),
  ];
  if (cas.length > 0) {
    throw new Error(
      `L'import est arrêté avant tout dépôt et toute écriture, ${cas.length} cas :\n` +
        cas.join('\n')
    );
  }
};
