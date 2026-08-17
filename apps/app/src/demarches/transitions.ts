import { appLabels } from '@/app/labels/catalog';
import type { DemarchePcaetTransitionEvaluation } from '@tet/domain/demarches';

/**
 * Ce qui retient une transition, dit à l'utilisateur. Le serveur évalue les
 * guards et renvoie ceux qui bloquent, dans leur ordre de priorité : le front
 * ne fait que traduire le premier.
 */
export const getTransitionBlocageLabel = (
  evaluation: DemarchePcaetTransitionEvaluation | undefined
): string | undefined => {
  if (!evaluation || evaluation.enabled) return undefined;
  const [firstBlocking] = evaluation.blockedBy;
  return firstBlocking
    ? appLabels.demarcheTransitionBlocage[firstBlocking]
    : undefined;
};
