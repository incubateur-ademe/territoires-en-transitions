import {
  CollectiviteType,
  collectiviteTypeEnum,
} from '@tet/domain/collectivites';
import { Snbc3Territoire } from './build-snbc3-valeurs';

/** Paris, seul territoire de niveau commune (subdivision de la MGP). */
const SNBC3_NIVEAU_GEO_COMMUNE = 'COMMUNE';

export type Snbc3CollectiviteKey =
  | { siren: string; communeCode?: never }
  | { communeCode: string; siren?: never };

/**
 * Clé de rattachement d'un territoire SNBC 3 à une collectivité TeT :
 * `collectivite.siren` pour un EPCI ou un EPT, `collectivite.commune_code`
 * pour Paris. Partagée par l'import et l'export du classeur (lot 5).
 */
export function getSnbc3CollectiviteKey(
  territoire: Pick<Snbc3Territoire, 'code' | 'niveauGeo'>
): Snbc3CollectiviteKey {
  return territoire.niveauGeo === SNBC3_NIVEAU_GEO_COMMUNE
    ? { communeCode: territoire.code }
    : { siren: territoire.code };
}

/**
 * Code d'une collectivité dans `snbc3` (parquet et classeur), réciproque de
 * `getSnbc3CollectiviteKey` : le code commune pour une commune (Paris), le
 * SIREN sinon. `null` si la collectivité n'a pas ce code.
 */
export function getSnbc3CodeTerritoire(collectivite: {
  type: CollectiviteType;
  siren: string | null;
  communeCode: string | null;
}): string | null {
  return collectivite.type === collectiviteTypeEnum.COMMUNE
    ? collectivite.communeCode
    : collectivite.siren;
}
