import * as z from 'zod/mini';
import { createWorkflow } from '../../utils/workflow/create-workflow';
import type {
  WorkflowApplyResult,
  WorkflowGuardResults,
  WorkflowTransitionDef,
  WorkflowTransitionError,
} from '../../utils/workflow/workflow.types';
import {
  DemarchePcaetStatusEnum,
  type DemarchePcaetStatus,
} from './demarche-pcaet-status.enum.schema';

/**
 * Cycle de vie d'un dépôt PCAET :
 *
 * 1. `en_elaboration` — la collectivité constitue son dossier (documents
 *    réglementaires, diagnostic par volet, programme d'actions).
 * 2. `transmis_pour_avis` — le dossier est transmis aux instances
 *    consultatives : préfet de région, conseil régional et MRAe (avis rendus
 *    via les services déconcentrés — DREAL/DDT — sur la plateforme).
 * 3. `adopte` — la délibération d'adoption est déposée : PCAET en vigueur,
 *    piloté pendant 6 ans (bilan à mi-parcours puis évaluation finale).
 * 4. `archive` — l'évaluation finale est déposée, le cycle est clos ; un
 *    nouveau dépôt (renouvellement) peut démarrer dès l'adoption.
 */

export const DEMARCHE_PCAET_INITIAL_STATUS =
  DemarchePcaetStatusEnum.EN_ELABORATION;

/** Délai légal laissé aux instances consultatives pour rendre leurs avis. */
export const DEMARCHE_PCAET_DELAI_AVIS_MOIS = 3;

/**
 * Échéance de remise des avis pour une transmission donnée. Figée en base à
 * la transmission : si le délai légal change, les dossiers déjà transmis
 * gardent l'échéance qui s'appliquait à eux.
 */
export const computeAvisDeadline = (transmittedAt: Date): Date => {
  const deadline = new Date(transmittedAt);
  // Calendrier UTC : même échéance quel que soit le fuseau du serveur.
  deadline.setUTCMonth(deadline.getUTCMonth() + DEMARCHE_PCAET_DELAI_AVIS_MOIS);
  return deadline;
};

/**
 * Guards : l'unique système de conditions des transitions, évalué côté
 * serveur uniquement — le front reçoit `availableTransitions` via l'API.
 * - `estPilote` : l'utilisateur est pilote de la démarche (fallback : si la
 *   démarche n'a aucun pilote à compte utilisateur, tout éditeur est autorisé).
 * - `dossierComplet` : pièces requises couvertes et programme d'actions rattaché.
 * - `delaiAvisEcoule` : avis reçus ou délai légal écoulé depuis la transmission.
 * - `evaluationFinaleDeposee` : l'évaluation finale du PCAET est déposée.
 */
export type DemarchePcaetGuardId =
  | 'estPilote'
  | 'dossierComplet'
  | 'delaiAvisEcoule'
  | 'evaluationFinaleDeposee';

export type DemarchePcaetGuardResults =
  WorkflowGuardResults<DemarchePcaetGuardId>;

export type DemarchePcaetTransitionDef = WorkflowTransitionDef<
  DemarchePcaetStatus,
  DemarchePcaetGuardId
>;

export const DemarchePcaetTransitionEnum = {
  TRANSMETTRE_POUR_AVIS: 'transmettre_pour_avis',
  REPRENDRE_ELABORATION: 'reprendre_elaboration',
  ADOPTER: 'adopter',
  ARCHIVER: 'archiver',
} as const;

export const DEMARCHE_PCAET_TRANSITIONS = {
  // `dossierComplet` porte aujourd'hui les documents réglementaires et le
  // rattachement du programme d'actions ; le diagnostic par volet s'y ajoutera
  // dès qu'il sera persisté côté API.
  [DemarchePcaetTransitionEnum.TRANSMETTRE_POUR_AVIS]: {
    from: [DemarchePcaetStatusEnum.EN_ELABORATION],
    to: DemarchePcaetStatusEnum.TRANSMIS_POUR_AVIS,
    guards: ['estPilote', 'dossierComplet'],
  },
  [DemarchePcaetTransitionEnum.REPRENDRE_ELABORATION]: {
    from: [DemarchePcaetStatusEnum.TRANSMIS_POUR_AVIS],
    to: DemarchePcaetStatusEnum.EN_ELABORATION,
    guards: ['estPilote'],
  },
  [DemarchePcaetTransitionEnum.ADOPTER]: {
    from: [DemarchePcaetStatusEnum.TRANSMIS_POUR_AVIS],
    to: DemarchePcaetStatusEnum.ADOPTE,
    guards: ['delaiAvisEcoule'],
  },
  [DemarchePcaetTransitionEnum.ARCHIVER]: {
    from: [DemarchePcaetStatusEnum.ADOPTE],
    to: DemarchePcaetStatusEnum.ARCHIVE,
    guards: ['estPilote', 'evaluationFinaleDeposee'],
  },
} as const satisfies Record<string, DemarchePcaetTransitionDef>;

export type DemarchePcaetTransition = keyof typeof DEMARCHE_PCAET_TRANSITIONS;

export const demarchePcaetWorkflow = createWorkflow<
  DemarchePcaetStatus,
  DemarchePcaetTransition,
  DemarchePcaetGuardId
>({
  initialStatus: DEMARCHE_PCAET_INITIAL_STATUS,
  transitions: DEMARCHE_PCAET_TRANSITIONS,
});

export const demarchePcaetTransitionValues =
  demarchePcaetWorkflow.transitionNames as [
    DemarchePcaetTransition,
    ...DemarchePcaetTransition[]
  ];

export const demarchePcaetTransitionSchema = z.enum(
  demarchePcaetTransitionValues
);

/**
 * Statuts d'une démarche « en cours » : une collectivité ne peut pas démarrer
 * un nouveau dépôt tant qu'une démarche est dans l'un de ces statuts.
 */
export const DEMARCHE_PCAET_ACTIVE_STATUSES = [
  DemarchePcaetStatusEnum.EN_ELABORATION,
  DemarchePcaetStatusEnum.TRANSMIS_POUR_AVIS,
] as const satisfies readonly DemarchePcaetStatus[];

export const isActiveDemarchePcaetStatus = (
  status: DemarchePcaetStatus
): boolean =>
  (DEMARCHE_PCAET_ACTIVE_STATUSES as readonly DemarchePcaetStatus[]).includes(
    status
  );

/**
 * Suppression : uniquement une démarche en élaboration **jamais transmise**.
 * Dès la première transmission, le dossier est engagé dans le circuit d'avis
 * (demandes, instruction) — il n'est plus supprimable, même après une reprise
 * d'élaboration.
 */
export const canDeleteDemarchePcaet = (demarche: {
  status: DemarchePcaetStatus;
  transmittedAt: string | null;
}): boolean =>
  demarche.status === DemarchePcaetStatusEnum.EN_ELABORATION &&
  demarche.transmittedAt === null;

/**
 * Statuts autorisant la mise à disposition du public (statut de publication) :
 * un dossier n'est publiable qu'une fois le PCAET adopté.
 */
export const DEMARCHE_PCAET_PUBLISHABLE_STATUSES = [
  DemarchePcaetStatusEnum.ADOPTE,
  DemarchePcaetStatusEnum.ARCHIVE,
] as const satisfies readonly DemarchePcaetStatus[];

export const canPublishDemarchePcaetStatus = (
  status: DemarchePcaetStatus
): boolean =>
  (
    DEMARCHE_PCAET_PUBLISHABLE_STATUSES as readonly DemarchePcaetStatus[]
  ).includes(status);

/** Le header d'une démarche n'est modifiable que pendant l'élaboration. */
export const isEditableDemarchePcaetStatus = (
  status: DemarchePcaetStatus
): boolean => status === DemarchePcaetStatusEnum.EN_ELABORATION;

export type DemarchePcaetTransitionError = WorkflowTransitionError;
export type ApplyTransitionResult = WorkflowApplyResult<DemarchePcaetStatus>;

/**
 * Règle du guard `estPilote` (évaluée côté serveur) : l'utilisateur est
 * pilote de la démarche — fallback : si la démarche n'a aucun pilote à
 * compte utilisateur, tout éditeur est autorisé.
 */
export const isDemarchePcaetPilote = (
  userId: string,
  pilotes: readonly { userId?: string | null }[]
): boolean => {
  const userPilotes = pilotes.filter((pilote) => pilote.userId);
  return (
    userPilotes.length === 0 ||
    userPilotes.some((pilote) => pilote.userId === userId)
  );
};

export const canTransition = demarchePcaetWorkflow.can;
export const getEnabledTransitions =
  demarchePcaetWorkflow.getEnabledTransitions;
export const applyTransition = demarchePcaetWorkflow.apply;
