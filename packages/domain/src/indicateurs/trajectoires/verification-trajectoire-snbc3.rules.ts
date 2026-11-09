import { type CollectiviteNatureType } from '../../collectivites/collectivite-banatic-type.enum';
import {
  collectiviteTypeEnum,
  type CollectiviteType,
} from '../../collectivites/collectivite-type.enum';

/**
 * Disponibilité de la trajectoire SNBC 3 pour une collectivité (lot 2 du plan
 * SNBC 3). Au lot 6, ces statuts remplaceront `VerificationTrajectoireStatus`.
 */
export enum StatutTrajectoireSnbc3 {
  DROITS_INSUFFISANTS = 'droits_insuffisants',
  /**
   * Collectivité présente dans le millésime importé (au moins une valeur
   * `snbc3`), quelle que soit sa nature. L'import écrit toutes les années d'un
   * territoire ensemble : on ne vérifie pas chaque année ni chaque secteur.
   */
  DISPONIBLE = 'disponible',
  /** EPCI à fiscalité propre ou EPT absent du millésime (fusion récente, DROM non couverts). */
  ABSENT_DU_MILLESIME = 'absent_du_millesime',
  /** Commune absente du millésime : la trajectoire est celle de son EPCI. */
  COMMUNE_NON_SUPPORTEE = 'commune_non_supportee',
  /** Région, département, syndicat, PETR… : maille au-dessus de l'EPCI. */
  SUPRA_NON_SUPPORTE = 'supra_non_supporte',
}

/** Natures des EPCI à fiscalité propre : celles qu'on propose comme EPCI parent d'une commune. */
export const EPCI_FISCALITE_PROPRE_NATURES: readonly CollectiviteNatureType[] =
  ['CC', 'CA', 'CU', 'METRO'];

/**
 * Natures couvertes par le millésime SNBC 3 : EPCI à fiscalité propre et EPT
 * de la Métropole du Grand Paris.
 */
const NATURES_COUVERTES_SNBC3: readonly CollectiviteNatureType[] = [
  ...EPCI_FISCALITE_PROPRE_NATURES,
  'EPT',
];

export function isEpciFiscalitePropre(
  natureInsee: CollectiviteNatureType | null | undefined
): boolean {
  return !!natureInsee && EPCI_FISCALITE_PROPRE_NATURES.includes(natureInsee);
}

/**
 * Règles évaluées dans l'ordre :
 * 0. droits insuffisants ;
 * 1. présente dans le millésime → disponible (EPCI, EPT, Paris) ;
 * 2. EPCI à fiscalité propre ou EPT absent → absent du millésime. Les
 *    collectivités de test, qui n'ont pas de SIREN dans le parquet, y tombent
 *    aussi : elles servent à tester le cas des fusions récentes ;
 * 3. commune absente → commune non supportée ;
 * 4. tout le reste → maille non supportée.
 */
export function getStatutTrajectoireSnbc3({
  hasDroitsLecture,
  isInMillesime,
  collectivite,
}: {
  hasDroitsLecture: boolean;
  isInMillesime: boolean;
  collectivite: {
    type: CollectiviteType;
    natureInsee: CollectiviteNatureType | null;
  };
}): StatutTrajectoireSnbc3 {
  if (!hasDroitsLecture) {
    return StatutTrajectoireSnbc3.DROITS_INSUFFISANTS;
  }
  if (isInMillesime) {
    return StatutTrajectoireSnbc3.DISPONIBLE;
  }
  if (
    collectivite.type === collectiviteTypeEnum.TEST ||
    (collectivite.natureInsee !== null &&
      NATURES_COUVERTES_SNBC3.includes(collectivite.natureInsee))
  ) {
    return StatutTrajectoireSnbc3.ABSENT_DU_MILLESIME;
  }
  if (collectivite.type === collectiviteTypeEnum.COMMUNE) {
    return StatutTrajectoireSnbc3.COMMUNE_NON_SUPPORTEE;
  }
  return StatutTrajectoireSnbc3.SUPRA_NON_SUPPORTE;
}
