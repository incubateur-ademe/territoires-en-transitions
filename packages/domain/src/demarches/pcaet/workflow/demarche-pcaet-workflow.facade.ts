import type {
  WorkflowApplyResult,
  WorkflowEvaluation,
  WorkflowTransitionError,
  WorkflowTransitionEvaluation,
} from '../../../utils/workflow/workflow.types';
import type { DemarchePcaetStatus } from '../demarche-pcaet-status.enum.schema';
import { demarchePcaetWorkflow } from './demarche-pcaet.workflow';
import type { DemarchePcaetGuardId } from './guards/demarche-pcaet-guard.types';
import type { DemarchePcaetTransition } from './transitions/demarche-pcaet-transition.enum';

/**
 * La surface du workflow pour les appelants : évaluer ce qui est possible, et
 * appliquer une transition. Nommée ici pour que backend et front n'aient pas à
 * connaître l'objet workflow lui-même.
 */

export type DemarchePcaetTransitionError = WorkflowTransitionError;

export type ApplyTransitionResult = WorkflowApplyResult<
  DemarchePcaetStatus,
  DemarchePcaetGuardId
>;

/**
 * État d'une transition tel que le serveur le calcule et que le front le lit :
 * `enabled` arme le bouton, `blockedBy` dit pourquoi il ne l'est pas.
 */
export type DemarchePcaetTransitionEvaluation =
  WorkflowTransitionEvaluation<DemarchePcaetGuardId>;

export type DemarchePcaetTransitionEvaluations = WorkflowEvaluation<
  DemarchePcaetTransition,
  DemarchePcaetGuardId
>;

/**
 * Guards dont dépend au moins une transition partant de ce statut : c'est ce
 * qui décide des lectures en base, au lieu d'une règle écrite à la main.
 */
export const getRequiredGuards = demarchePcaetWorkflow.getRequiredGuards;

/** État de chaque transition, pour un statut et des résultats de guards donnés. */
export const evaluateTransitions = demarchePcaetWorkflow.evaluate;

/** Point d'entrée unique d'écriture d'état. */
export const applyTransition = demarchePcaetWorkflow.apply;
