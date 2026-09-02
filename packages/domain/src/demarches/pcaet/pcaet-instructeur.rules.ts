import { CollectiviteType, collectiviteTypeEnum } from '../../collectivites';
import {
  PcaetAvisAuTitreDeEnum,
  type PcaetAvisAuTitreDe,
} from './pcaet-avis-au-titre-de.enum.schema';

/** `NATIONAL` ne se compare à aucun code : il n'a pas de colonne à confronter. */
export const PerimetreInstructeurEnum = {
  REGION: 'region',
  DEPARTEMENT: 'departement',
  NATIONAL: 'national',
} as const;

export type PerimetreInstructeur =
  (typeof PerimetreInstructeurEnum)[keyof typeof PerimetreInstructeurEnum];

/**
 * Ce qu'un type d'instructeur peut faire sur un dossier PCAET.
 *
 * - `perimetre` — l'étendue sur laquelle il voit les dossiers.
 * - `titresAvis` — les titres au nom desquels il se prononce, vide pour un
 *   destinataire en lecture.
 *
 * Ces listes gouvernent aussi la clôture de l'instruction : `avisTousRendus`
 * attend de chaque demande les titres attendus *de son destinataire*, et non
 * l'ensemble des titres — sans quoi la DREAL devrait rendre l'avis du président
 * de région, et un destinataire en lecture empêcherait à jamais un dossier de
 * devenir `instruit`.
 */
type ProfilInstructeur = {
  perimetre: PerimetreInstructeur;
  titresAvis: readonly PcaetAvisAuTitreDe[];
};

const profilParTypeInstructeur = {
  [collectiviteTypeEnum.DREAL]: {
    perimetre: PerimetreInstructeurEnum.REGION,
    titresAvis: [
      PcaetAvisAuTitreDeEnum.PREFET_REGION,
      PcaetAvisAuTitreDeEnum.AUTORITE_ENVIRONNEMENTALE,
    ],
  },
  [collectiviteTypeEnum.REGION]: {
    perimetre: PerimetreInstructeurEnum.REGION,
    titresAvis: [PcaetAvisAuTitreDeEnum.PRESIDENT_REGION],
  },
  [collectiviteTypeEnum.DDT]: {
    perimetre: PerimetreInstructeurEnum.DEPARTEMENT,
    titresAvis: [],
  },
  [collectiviteTypeEnum.DR_ADEME]: {
    perimetre: PerimetreInstructeurEnum.REGION,
    titresAvis: [],
  },
  [collectiviteTypeEnum.SERVICE_NATIONAL]: {
    perimetre: PerimetreInstructeurEnum.NATIONAL,
    titresAvis: [],
  },
} as const satisfies Partial<Record<CollectiviteType, ProfilInstructeur>>;

type TypeInstructeur = keyof typeof profilParTypeInstructeur;

export const typesInstructeur: readonly CollectiviteType[] = Object.keys(
  profilParTypeInstructeur
) as CollectiviteType[];

export const isTypeInstructeur = (type: CollectiviteType): boolean =>
  type in profilParTypeInstructeur;

export const getPerimetreInstructeur = (
  type: CollectiviteType
): PerimetreInstructeur | undefined =>
  profilParTypeInstructeur[type as TypeInstructeur]?.perimetre;

export const typesInstructeurDuPerimetre = (
  perimetre: PerimetreInstructeur
): readonly CollectiviteType[] =>
  typesInstructeur.filter(
    (type) => getPerimetreInstructeur(type) === perimetre
  );

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
