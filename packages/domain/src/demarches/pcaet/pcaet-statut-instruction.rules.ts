import * as z from 'zod/mini';
import {
  DemarchePcaetStatusEnum,
  type DemarchePcaetStatus,
} from './demarche-pcaet-status.enum.schema';
import {
  getDemandeAvisEtat,
  getEtatDossierEnLecture,
  PcaetDemandeAvisEtatEnum,
  type PcaetDemandeAvisEtat,
} from './pcaet-demande-avis-etat.rules';
import type { DemandeAvisAchevement } from './workflow/guards/demarche-pcaet-guard.rules';

/**
 * Ce qu'un service de l'État lit dans la colonne « Statut » de son suivi.
 *
 * Un seul vocabulaire là où le modèle en a deux : le statut du dépôt
 * (`DemarchePcaetStatus`, côté collectivité) et l'état de la saisine
 * (`PcaetDemandeAvisEtat`, côté instruction). Aucun des deux ne suffit — le
 * premier ignore où en est l'avis, le second n'existe pas avant la
 * transmission et ne dit rien d'une collectivité qui n'a rien déposé.
 *
 * Un statut par étape du cycle de vie, et rien d'autre. Deux valeurs ont été
 * écartées parce qu'elles n'en étaient pas :
 *
 * - **le brouillon d'avis** décrit l'avancement de l'agent, pas celui du
 *   dossier — qui reste à instruire tant que rien n'est validé ;
 * - **la révision** est un attribut du dossier, non une étape : le workflow est
 *   linéaire et sans retour, et un renouvellement est un nouveau dépôt qui
 *   parcourt le même cycle depuis `en_elaboration`.
 *
 * L'ordre des valeurs suit le cycle de vie, de l'amont à l'aval : c'est lui qui
 * ordonne le tri par statut.
 */
export const PcaetStatutInstructionEnum = {
  /** Aucune démarche PCAET : la collectivité n'a rien déposé. */
  AUCUN_DEPOT: 'aucun_depot',
  /** Un dépôt en cours de constitution — premier PCAET comme renouvellement. */
  EN_ELABORATION: 'en_elaboration',
  EN_INSTRUCTION: 'en_instruction',
  PAS_D_AVIS_DEPOSE: 'pas_d_avis_depose',
  INSTRUIT: 'instruit',
  /** `publie` : l'adoption et la mise à disposition du public sont un seul acte. */
  ADOPTE: 'adopte',
  ARCHIVE: 'archive',
} as const;

export const pcaetStatutInstructionValues = [
  PcaetStatutInstructionEnum.AUCUN_DEPOT,
  PcaetStatutInstructionEnum.EN_ELABORATION,
  PcaetStatutInstructionEnum.EN_INSTRUCTION,
  PcaetStatutInstructionEnum.PAS_D_AVIS_DEPOSE,
  PcaetStatutInstructionEnum.INSTRUIT,
  PcaetStatutInstructionEnum.ADOPTE,
  PcaetStatutInstructionEnum.ARCHIVE,
] as const;

export const pcaetStatutInstructionSchema = z.enum(
  pcaetStatutInstructionValues
);

export type PcaetStatutInstruction = z.infer<
  typeof pcaetStatutInstructionSchema
>;

/**
 * Ce que le service voit sans rien demander.
 *
 * Reproduit ce que l'écran montrait avant les filtres : les dossiers dont il a
 * la charge, sans les dépôts en chantier ni les cycles clos. Les trois exclus
 * sont précisément les nouveautés — une DREAL, et plus encore la DGEC avec son
 * périmètre national, ne veut pas ouvrir sa liste sur un millier de
 * collectivités qui n'ont rien déposé.
 */
export const STATUTS_INSTRUCTION_PAR_DEFAUT = [
  PcaetStatutInstructionEnum.EN_INSTRUCTION,
  PcaetStatutInstructionEnum.PAS_D_AVIS_DEPOSE,
  PcaetStatutInstructionEnum.INSTRUIT,
  PcaetStatutInstructionEnum.ADOPTE,
] as const;

/**
 * Traduction de l'état d'une saisine dans le vocabulaire du suivi.
 *
 * Un avis commencé mais pas validé laisse le dossier « à instruire » : le
 * brouillon dit où en est l'agent, pas où en est le dossier, et il ne sort pas
 * de son espace. `clos` ne figure pas ici : il ne vaut que pour un dépôt publié
 * ou archivé, et `getStatutInstruction` traite ces deux statuts avant d'en
 * arriver là.
 */
const STATUT_PAR_ETAT = {
  [PcaetDemandeAvisEtatEnum.A_TRAITER]: PcaetStatutInstructionEnum.EN_INSTRUCTION,
  [PcaetDemandeAvisEtatEnum.BROUILLON_EN_COURS]:
    PcaetStatutInstructionEnum.EN_INSTRUCTION,
  [PcaetDemandeAvisEtatEnum.AVIS_RENDU]: PcaetStatutInstructionEnum.INSTRUIT,
  [PcaetDemandeAvisEtatEnum.DELAI_ECOULE]:
    PcaetStatutInstructionEnum.PAS_D_AVIS_DEPOSE,
  [PcaetDemandeAvisEtatEnum.CLOS]: PcaetStatutInstructionEnum.ARCHIVE,
} as const satisfies Record<PcaetDemandeAvisEtat, PcaetStatutInstruction>;

export type StatutInstructionEntree = {
  /** `null` quand la collectivité n'a aucune démarche PCAET. */
  demarcheStatus: DemarchePcaetStatus | null;
  avisDeadlineAt: string | null;
  /**
   * Cette saisine appelle-t-elle un avis, ou une simple lecture ? Se lit par
   * ligne et non par service : depuis un périmètre secondaire, une DREAL lit
   * sans se prononcer.
   */
  deposeAvis: boolean;
  nbAvisValides: number;
  nbAvisBrouillons: number;
  /** Avis validés du dossier, pour un destinataire qui n'en dépose aucun. */
  achevement: readonly DemandeAvisAchevement[];
};

/**
 * Le statut d'une ligne du suivi d'instruction.
 *
 * Ne réimplémente aucune règle d'avis : les quatre cas que l'état de saisine ne
 * sait pas dire sont traités ici, et tout ce qui relève de l'avis est délégué
 * aux règles existantes — `getDemandeAvisEtat` quand le service se prononce,
 * `getEtatDossierEnLecture` quand il ne fait que lire.
 */
export const getStatutInstruction = (
  {
    demarcheStatus,
    avisDeadlineAt,
    deposeAvis,
    nbAvisValides,
    nbAvisBrouillons,
    achevement,
  }: StatutInstructionEntree,
  now: Date
): PcaetStatutInstruction => {
  if (demarcheStatus === null) {
    return PcaetStatutInstructionEnum.AUCUN_DEPOT;
  }
  if (demarcheStatus === DemarchePcaetStatusEnum.ARCHIVE) {
    return PcaetStatutInstructionEnum.ARCHIVE;
  }
  if (demarcheStatus === DemarchePcaetStatusEnum.PUBLIE) {
    return PcaetStatutInstructionEnum.ADOPTE;
  }
  if (demarcheStatus === DemarchePcaetStatusEnum.EN_ELABORATION) {
    return PcaetStatutInstructionEnum.EN_ELABORATION;
  }

  // Ne restent que `transmis_pour_avis` et `instruit` : le dossier est dans la
  // fenêtre où l'avis se joue, et c'est l'état de la saisine qui parle.
  const etat = deposeAvis
    ? getDemandeAvisEtat(
        {
          demarcheStatus,
          avisDeadlineAt,
          nbAvisValides,
          nbAvisBrouillons,
        },
        now
      )
    : getEtatDossierEnLecture(
        { demarcheStatus, avisDeadlineAt, achevement },
        now
      );

  return STATUT_PAR_ETAT[etat];
};
