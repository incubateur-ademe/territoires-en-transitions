/** Les services qui couvrent chaque dossier et leur périmètre, par la règle du backend qu'appelle une transmission pour avis. */

import { PcaetInstructeursRepository } from '@tet/backend/demarches/pcaet/shared/pcaet-instructeurs.repository';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { PcaetPerimetreSaisine } from '@tet/domain/demarches';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import type { Dossier } from './dossiers';

export type Saisine = {
  dossier: Dossier;
  serviceId: number;
  service: string;
  perimetre: PcaetPerimetreSaisine;
};

/**
 * Une saisine par dossier et par service qui couvre sa collectivité, calculée une fois par collectivité.
 * Le repository est créé sans Nest : il ne lit que `.db` (comme `rattraper-saisines-pcaet`).
 */
export const listSaisines = async (
  pool: Pool,
  dossiers: readonly Dossier[]
): Promise<Saisine[]> => {
  const repository = new PcaetInstructeursRepository({
    db: drizzle(pool),
  } as unknown as DatabaseService);

  const couvrantsParCollectivite = new Map<
    number,
    Awaited<ReturnType<typeof repository.listInstructeursCouvrants>>
  >();
  const saisines: Saisine[] = [];
  for (const dossier of dossiers) {
    let couvrants = couvrantsParCollectivite.get(dossier.collectiviteId);
    if (couvrants === undefined) {
      couvrants = await repository.listInstructeursCouvrants(
        dossier.collectiviteId
      );
      couvrantsParCollectivite.set(dossier.collectiviteId, couvrants);
    }
    for (const couvrant of [...couvrants].sort(
      (a, b) => a.collectiviteId - b.collectiviteId
    )) {
      saisines.push({
        dossier,
        serviceId: couvrant.collectiviteId,
        service: couvrant.nom,
        perimetre: couvrant.perimetre,
      });
    }
  }
  return saisines;
};
