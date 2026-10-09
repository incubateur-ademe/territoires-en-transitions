import * as z from 'zod/mini';
import { createEnumObject } from '../../utils';

/**
 * Cycle de vie d'un plan : `importing` pendant l'import IA, `to_verify` une
 * fois importé, `active` après vérification ou création à la main, `failed`
 * si l'import a échoué (le plan reste visible pour être supprimé).
 */
export const planStatusValues = [
  'importing',
  'to_verify',
  'active',
  'failed',
] as const;

export const PlanStatusEnum = createEnumObject(planStatusValues);
export const planStatusSchema = z.enum(planStatusValues);
export type PlanStatus = z.infer<typeof planStatusSchema>;

/** Statuts d'un plan que l'on peut ouvrir et utiliser. */
export const navigablePlanStatuses: PlanStatus[] = [
  PlanStatusEnum.TO_VERIFY,
  PlanStatusEnum.ACTIVE,
];

export const isPlanNavigable = (plan: { status: PlanStatus }): boolean =>
  navigablePlanStatuses.includes(plan.status);

/** Un plan importé par IA reste à vérifier tant qu'un humain ne l'a pas validé. */
export const isPlanPendingVerification = (plan: {
  status: PlanStatus;
}): boolean => plan.status === PlanStatusEnum.TO_VERIFY;
