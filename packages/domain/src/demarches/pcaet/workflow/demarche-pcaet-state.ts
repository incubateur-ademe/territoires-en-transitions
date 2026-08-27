import {
  DemarchePcaetStatusEnum,
  type DemarchePcaetStatus,
} from '../demarche-pcaet-status.enum.schema';
import { isDemarchePcaetAmontModifiable } from '../demarche-pcaet-modifiable.rules';

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
 * 4. `publie` — la délibération d'adoption est déposée : PCAET en vigueur et
 *    mis à disposition du public, piloté pendant 6 ans (bilan à mi-parcours
 *    puis évaluation finale).
 * 5. `archive` — l'évaluation finale est déposée, le cycle est clos ; un
 *    nouveau dépôt (renouvellement) peut démarrer.
 */
export const DEMARCHE_PCAET_INITIAL_STATUS =
  DemarchePcaetStatusEnum.EN_ELABORATION;

/**
 * Étapes du parcours affiché. Une étape par statut : l'adoption et la mise à
 * disposition du public ayant fusionné, il n'y a plus deux statuts à replier
 * sur la même étape.
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
 * Suppression : uniquement une démarche en élaboration.
 *
 * Le statut y suffit désormais : la transmission est la seule sortie de
 * l'élaboration et rien n'y ramène, donc un dossier en élaboration n'a jamais
 * été transmis — il n'est engagé dans aucun circuit d'avis. Le prédicat reste
 * nommé à part parce que « supprimable » et « modifiable en amont » sont deux
 * questions distinctes, qui se répondent aujourd'hui de la même façon.
 */
export const canDeleteDemarchePcaet = (demarche: {
  status: DemarchePcaetStatus;
}): boolean => isDemarchePcaetAmontModifiable(demarche.status);
