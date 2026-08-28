import { CollectiviteType, collectiviteTypeEnum } from '../../collectivites';
import {
  PcaetAvisAuTitreDeEnum,
  type PcaetAvisAuTitreDe,
} from './pcaet-avis-au-titre-de.enum.schema';

export type CleGeoInstructeur = 'regionCode' | 'departementCode';

/**
 * Ce qu'un type d'instructeur peut faire sur un dossier PCAET.
 *
 * - `cleGeo` — le périmètre sur lequel il voit les dossiers : la région pour les
 *   instances régionales, le département pour les services départementaux.
 * - `titresAvis` — les titres au nom desquels il se prononce. La DREAL dépose
 *   pour le préfet de région et pour l'autorité environnementale, le conseil
 *   régional pour son président ; la DDT lit le dossier sans se prononcer, sa
 *   liste est donc vide.
 *
 * Ces listes gouvernent aussi la clôture de l'instruction : `avisTousRendus`
 * attend de chaque demande les titres attendus *de son destinataire*, et non
 * l'ensemble des titres — sans quoi la DREAL devrait rendre l'avis du président
 * de région, et une DDT en lecture empêcherait à jamais un dossier de devenir
 * `instruit`.
 */
type ProfilInstructeur = {
  cleGeo: CleGeoInstructeur;
  titresAvis: readonly PcaetAvisAuTitreDe[];
};

const profilParTypeInstructeur = {
  [collectiviteTypeEnum.DREAL]: {
    cleGeo: 'regionCode',
    titresAvis: [
      PcaetAvisAuTitreDeEnum.PREFET_REGION,
      PcaetAvisAuTitreDeEnum.AUTORITE_ENVIRONNEMENTALE,
    ],
  },
  [collectiviteTypeEnum.REGION]: {
    cleGeo: 'regionCode',
    titresAvis: [PcaetAvisAuTitreDeEnum.PRESIDENT_REGION],
  },
  [collectiviteTypeEnum.DDT]: {
    cleGeo: 'departementCode',
    titresAvis: [],
  },
} as const satisfies Partial<Record<CollectiviteType, ProfilInstructeur>>;

type TypeInstructeur = keyof typeof profilParTypeInstructeur;

export const typesInstructeur: readonly CollectiviteType[] = Object.keys(
  profilParTypeInstructeur
) as CollectiviteType[];

export const isTypeInstructeur = (type: CollectiviteType): boolean =>
  type in profilParTypeInstructeur;

export const getCleGeoInstructeur = (
  type: CollectiviteType
): CleGeoInstructeur | undefined =>
  profilParTypeInstructeur[type as TypeInstructeur]?.cleGeo;

/**
 * Les titres au nom desquels ce type d'instructeur peut déposer, vide pour tout
 * ce qui n'en dépose aucun — un type non instructeur comme un destinataire en
 * lecture.
 */
export const getTitresAvisInstructeur = (
  type: CollectiviteType
): readonly PcaetAvisAuTitreDe[] =>
  profilParTypeInstructeur[type as TypeInstructeur]?.titresAvis ?? [];

/**
 * Cet instructeur est-il saisi pour avis, ou seulement destinataire en lecture ?
 * Répond `false` pour tout ce qui n'est pas un type instructeur.
 */
export const peutDeposerAvisInstructeur = (type: CollectiviteType): boolean =>
  getTitresAvisInstructeur(type).length > 0;

/** Les seuls types dont un avis peut émaner — contrainte reprise en base. */
export const typesInstructeurDeposantAvis: readonly CollectiviteType[] =
  typesInstructeur.filter(peutDeposerAvisInstructeur);
