/** Les services qui couvrent chaque dossier et leur périmètre, par la règle du backend qu'appelle une transmission pour avis. */

import { PcaetInstructeursRepository } from '@tet/backend/demarches/pcaet/shared/pcaet-instructeurs.repository';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import {
  collectiviteTypeEnum,
  type CollectiviteType,
} from '@tet/domain/collectivites';
import {
  PcaetPerimetreSaisineEnum,
  type PcaetPerimetreSaisine,
} from '@tet/domain/demarches';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { decrireDossier, type Dossier } from './dossiers';

export type Saisine = {
  dossier: Dossier;
  serviceId: number;
  service: string;
  type: CollectiviteType;
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
        type: couvrant.type,
        perimetre: couvrant.perimetre,
      });
    }
  }
  return saisines;
};

const SERVICES_ATTENDUS = [
  { type: collectiviteTypeEnum.DREAL, nom: 'DREAL' },
  { type: collectiviteTypeEnum.REGION, nom: 'région' },
];

/** Garde, appelée par `gardes.ts` : un dossier transmis sans DREAL ou sans région principale, personne ne rendrait l'avis attendu. */
export const listCasBloquantsServices = (
  dossiers: readonly Dossier[],
  saisines: readonly Saisine[]
) =>
  dossiers.flatMap((dossier) =>
    SERVICES_ATTENDUS.filter(
      ({ type }) =>
        !saisines.some(
          (s) =>
            s.dossier.demarcheId === dossier.demarcheId &&
            s.type === type &&
            s.perimetre === PcaetPerimetreSaisineEnum.PRINCIPAL
        )
    ).map(
      ({ nom }) =>
        `  dossier sans ${nom} principale : ${decrireDossier(dossier)}`
    )
  );
