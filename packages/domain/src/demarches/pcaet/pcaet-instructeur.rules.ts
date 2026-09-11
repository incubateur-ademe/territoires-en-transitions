import { CollectiviteType, collectiviteTypeEnum } from '../../collectivites';
import {
  PcaetAvisAuTitreDeEnum,
  type PcaetAvisAuTitreDe,
} from './pcaet-avis-au-titre-de.enum.schema';
import {
  PcaetPerimetreSaisineEnum,
  type PcaetPerimetreSaisine,
} from './pcaet-perimetre-saisine.enum.schema';

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
 * - `titresAvis` — les titres au nom desquels il se prononce : un seul pour
 *   chaque émetteur aujourd'hui, aucun pour un destinataire en lecture. La
 *   liste reste une liste : le modèle sait porter plusieurs titres par
 *   émetteur si un autre avis venait à se rendre ici.
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
    titresAvis: [PcaetAvisAuTitreDeEnum.PREFET_REGION],
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
 * Les titres attendus d'une **saisine**, et non d'un type.
 *
 * Deux choses ferment le dépôt, et il faut les deux : la famille du destinataire
 * — une DDT ne se prononce jamais — et le territoire qui vaut la saisine. Un
 * service atteint par un périmètre secondaire de la déposante reçoit le dossier
 * en lecture : l'avis revient à celui du siège.
 *
 * Rendre `[]` suffit à tout fermer, et c'est voulu : `titresDeposables` se vide,
 * `canDeposerAvis` refuse, et `isDemarchePcaetAvisTousRendus` écarte la demande
 * du décompte. Sans quoi une DREAL limitrophe attendrait un avis qu'elle ne
 * rendra jamais, et le dossier n'aurait plus que l'échéance pour s'achever.
 */
export const getTitresAvisSaisine = (
  type: CollectiviteType,
  perimetre: PcaetPerimetreSaisine
): readonly PcaetAvisAuTitreDe[] =>
  perimetre === PcaetPerimetreSaisineEnum.SECONDAIRE
    ? []
    : getTitresAvisInstructeur(type);

/** Cette saisine appelle-t-elle un avis, ou seulement une lecture ? */
export const peutDeposerAvisSaisine = (
  type: CollectiviteType,
  perimetre: PcaetPerimetreSaisine
): boolean => getTitresAvisSaisine(type, perimetre).length > 0;

/**
 * Cet instructeur est-il saisi pour avis, ou seulement destinataire en lecture ?
 * Répond `false` pour tout ce qui n'est pas un type instructeur.
 */
export const peutDeposerAvisInstructeur = (type: CollectiviteType): boolean =>
  getTitresAvisInstructeur(type).length > 0;

/** Les seuls types dont un avis peut émaner — contrainte reprise en base. */
export const typesInstructeurDeposantAvis: readonly CollectiviteType[] =
  typesInstructeur.filter(peutDeposerAvisInstructeur);
