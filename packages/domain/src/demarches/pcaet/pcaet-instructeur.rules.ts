import { CollectiviteType, collectiviteTypeEnum } from '../../collectivites';

export type CleGeoInstructeur = 'regionCode' | 'departementCode';

/**
 * Ce qu'un type d'instructeur peut faire sur un dossier PCAET.
 *
 * - `cleGeo` — le périmètre sur lequel il voit les dossiers : la région pour les
 *   instances régionales, le département pour les services départementaux.
 * - `peutDeposerAvis` — s'il est *saisi pour avis*, ou s'il ne fait que
 *   consulter. C'est la seule chose qui sépare la DREAL des deux autres : elle
 *   rend les deux avis attendus (préfet de région, autorité environnementale),
 *   là où la région et la DDT lisent le dossier sans se prononcer.
 *
 * Ce droit gouverne aussi la clôture de l'instruction : `avisTousRendus` exige
 * que **toutes** les demandes aient leurs titres validés, donc seules les
 * demandes des instructeurs déposants y comptent — sans quoi une DDT en lecture
 * seule empêcherait à jamais un dossier de devenir `instruit`.
 */
type ProfilInstructeur = {
  cleGeo: CleGeoInstructeur;
  peutDeposerAvis: boolean;
};

const profilParTypeInstructeur = {
  [collectiviteTypeEnum.DREAL]: { cleGeo: 'regionCode', peutDeposerAvis: true },
  [collectiviteTypeEnum.REGION]: {
    cleGeo: 'regionCode',
    peutDeposerAvis: false,
  },
  [collectiviteTypeEnum.DDT]: {
    cleGeo: 'departementCode',
    peutDeposerAvis: false,
  },
} as const satisfies Partial<Record<CollectiviteType, ProfilInstructeur>>;

export const typesInstructeur: readonly CollectiviteType[] = Object.keys(
  profilParTypeInstructeur
) as CollectiviteType[];

export const isTypeInstructeur = (type: CollectiviteType): boolean =>
  type in profilParTypeInstructeur;

export const getCleGeoInstructeur = (
  type: CollectiviteType
): CleGeoInstructeur | undefined =>
  profilParTypeInstructeur[type as keyof typeof profilParTypeInstructeur]
    ?.cleGeo;

/**
 * Cet instructeur est-il saisi pour avis, ou seulement destinataire en lecture ?
 * Répond `false` pour tout ce qui n'est pas un type instructeur.
 */
export const peutDeposerAvisInstructeur = (type: CollectiviteType): boolean =>
  profilParTypeInstructeur[type as keyof typeof profilParTypeInstructeur]
    ?.peutDeposerAvis === true;

/** Les seuls types dont un avis peut émaner — contrainte reprise en base. */
export const typesInstructeurDeposantAvis: readonly CollectiviteType[] =
  typesInstructeur.filter(peutDeposerAvisInstructeur);
