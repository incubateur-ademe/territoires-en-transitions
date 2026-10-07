import {
  DemarchePcaetStatusEnum,
  type DemarchePcaetStatus,
} from '../demarche-pcaet-status.enum.schema';

/**
 * Cycle de vie d'un dépôt PCAET :
 *
 * 1. `en_elaboration` — la collectivité constitue son dossier (documents
 *    réglementaires, diagnostic par topic, programme d'actions).
 * 2. `transmis_pour_avis` — le dossier est transmis aux instances
 *    consultatives : préfet de région, conseil régional et MRAe (avis rendus
 *    via les services déconcentrés — DREAL/DDT — sur la plateforme).
 * 3. `instruit` — les avis attendus sont rendus, ou le délai légal est échu.
 *    Le dépôt se finalise : la collectivité lit les avis et verse les pièces
 *    aval. Seul statut que la collectivité n'atteint pas elle-même.
 *    `instruit_hors_plateforme` est l'autre entrée de cette même étape, pour un
 *    PCAET déjà transmis et instruit ailleurs : la démarche y **démarre**, et y
 *    verse aussi bien ses pièces amont que ses pièces aval.
 * 4. `publie` — la délibération d'adoption est déposée : PCAET en vigueur et
 *    mis à disposition du public, piloté pendant 6 ans (bilan à mi-parcours
 *    puis évaluation finale).
 * 5. `archive` — l'évaluation finale est déposée, le cycle est clos ; un
 *    nouveau dépôt (renouvellement) peut démarrer.
 */
export const DEMARCHE_PCAET_INITIAL_STATUS =
  DemarchePcaetStatusEnum.EN_ELABORATION;

/**
 * Statut de départ d'une nouvelle démarche.
 *
 * Une collectivité dont le PCAET a déjà été transmis pour avis hors plateforme
 * n'a ni élaboration ni transmission à rejouer : son dossier démarre à l'étape
 * de finalisation. Le choix est fait à la création et ne se défait pas — d'où
 * une fonction du seul contexte de création, et non une transition.
 */
export const getDemarchePcaetInitialStatus = ({
  transmittedOffPlatform,
}: {
  transmittedOffPlatform?: boolean;
}): DemarchePcaetStatus =>
  transmittedOffPlatform
    ? DemarchePcaetStatusEnum.INSTRUIT_HORS_PLATEFORME
    : DEMARCHE_PCAET_INITIAL_STATUS;

/**
 * Étapes du parcours affiché. Une étape par statut, à une exception près : la
 * finalisation a deux entrées, selon que l'instruction a eu lieu sur la
 * plateforme ou en dehors.
 */
export const DEMARCHE_PCAET_ETAPES = [
  'elaboration',
  'transmis',
  'finalisation',
  'publie',
  'archive',
] as const;

export type DemarchePcaetEtape = (typeof DEMARCHE_PCAET_ETAPES)[number];

const DEMARCHE_PCAET_STATUS_ETAPES = {
  [DemarchePcaetStatusEnum.EN_ELABORATION]: 'elaboration',
  [DemarchePcaetStatusEnum.TRANSMIS_POUR_AVIS]: 'transmis',
  [DemarchePcaetStatusEnum.INSTRUIT]: 'finalisation',
  [DemarchePcaetStatusEnum.INSTRUIT_HORS_PLATEFORME]: 'finalisation',
  [DemarchePcaetStatusEnum.PUBLIE]: 'publie',
  [DemarchePcaetStatusEnum.ARCHIVE]: 'archive',
} as const satisfies Record<DemarchePcaetStatus, DemarchePcaetEtape>;

export const getEtapeDemarchePcaet = (
  status: DemarchePcaetStatus
): DemarchePcaetEtape => DEMARCHE_PCAET_STATUS_ETAPES[status];

/** Rang d'une étape dans le parcours. */
export const getIndexEtapeDemarchePcaet = (etape: DemarchePcaetEtape): number =>
  DEMARCHE_PCAET_ETAPES.indexOf(etape);

/** Rang de l'étape, pour ordonner l'affichage du parcours. */
export const getEtapeIndexDemarchePcaet = (
  status: DemarchePcaetStatus
): number => getIndexEtapeDemarchePcaet(getEtapeDemarchePcaet(status));

/**
 * Le dossier est-il consultable par le public ? Une démarche archivée l'a été
 * publiée et le reste.
 */
export const isPublieDemarchePcaetStatus = (
  status: DemarchePcaetStatus
): boolean =>
  status === DemarchePcaetStatusEnum.PUBLIE ||
  status === DemarchePcaetStatusEnum.ARCHIVE;

/**
 * Statuts d'un dépôt mené à son terme : le PCAET a été adopté et mis à
 * disposition du public, et le reste une fois archivé. C'est ce qui fait d'un
 * dépôt suivant un **renouvellement**.
 *
 * Exact complément de `DEMARCHE_PCAET_EN_COURS_STATUSES`.
 */
export const DEMARCHE_PCAET_ABOUTIES_STATUSES = [
  DemarchePcaetStatusEnum.PUBLIE,
  DemarchePcaetStatusEnum.ARCHIVE,
] as const satisfies readonly DemarchePcaetStatus[];

/**
 * Statuts d'une démarche « en cours » : une collectivité ne peut pas démarrer
 * un nouveau dépôt, ni réutiliser le plan d'action rattaché, tant qu'une
 * démarche est dans l'un de ces statuts.
 *
 * Décrit un **état**, pas un droit : ce qui est permis se lit dans les
 * capacités du workflow.
 */
export const DEMARCHE_PCAET_EN_COURS_STATUSES = [
  DemarchePcaetStatusEnum.EN_ELABORATION,
  DemarchePcaetStatusEnum.TRANSMIS_POUR_AVIS,
  DemarchePcaetStatusEnum.INSTRUIT,
  DemarchePcaetStatusEnum.INSTRUIT_HORS_PLATEFORME,
] as const satisfies readonly DemarchePcaetStatus[];

export const isDemarchePcaetEnCours = (status: DemarchePcaetStatus): boolean =>
  (DEMARCHE_PCAET_EN_COURS_STATUSES as readonly DemarchePcaetStatus[]).includes(
    status
  );

/**
 * Statuts pendant lesquels le circuit d'avis accepte encore des écritures.
 *
 * Distinct de « en cours » : `instruit` est un dépôt bien vivant, mais son
 * instruction est terminée — les services déconcentrés n'y touchent plus. C'est
 * cette distinction qui ferme le dossier côté instructeur, et elle ne se déduit
 * pas du seul fait que la démarche avance encore.
 */
export const DEMARCHE_PCAET_DEPOT_AVIS_STATUSES = [
  DemarchePcaetStatusEnum.EN_ELABORATION,
  DemarchePcaetStatusEnum.TRANSMIS_POUR_AVIS,
] as const satisfies readonly DemarchePcaetStatus[];

export const isDepotAvisOuvrable = (status: DemarchePcaetStatus): boolean =>
  (
    DEMARCHE_PCAET_DEPOT_AVIS_STATUSES as readonly DemarchePcaetStatus[]
  ).includes(status);

/**
 * Suppression : une démarche qui n'a encore rien engagé au dehors.
 *
 * Les deux statuts énumérés sont ceux d'un dossier dont aucune instance
 * consultative n'a été saisie **sur la plateforme** : l'élaboration, où la
 * transmission n'a pas encore eu lieu, et le dépôt hors plateforme, où elle
 * n'aura jamais lieu. Supprimer n'y défait donc rien aux yeux de personne.
 *
 * La liste est écrite ici plutôt que déléguée à `isDemarchePcaetAmontModifiable` :
 * « supprimable » et « modifiable en amont » sont deux questions distinctes, et
 * les faire coïncider par délégation ferait basculer l'une en changeant l'autre.
 */
export const DEMARCHE_PCAET_SUPPRIMABLES_STATUSES = [
  DemarchePcaetStatusEnum.EN_ELABORATION,
  DemarchePcaetStatusEnum.INSTRUIT_HORS_PLATEFORME,
] as const satisfies readonly DemarchePcaetStatus[];

export const canDeleteDemarchePcaet = (demarche: {
  status: DemarchePcaetStatus;
}): boolean =>
  (
    DEMARCHE_PCAET_SUPPRIMABLES_STATUSES as readonly DemarchePcaetStatus[]
  ).includes(demarche.status);
