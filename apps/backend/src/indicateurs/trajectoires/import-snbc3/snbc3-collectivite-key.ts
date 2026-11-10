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
