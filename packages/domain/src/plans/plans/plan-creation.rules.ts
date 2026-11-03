import { ELECTRIFICATION_PLAN_TYPE, PlanType } from './plan-type.schema';

export const planCreationDisabledReasons = [
  'ELECTRIFICATION_CREATION_DISABLED',
] as const;

export type PlanCreationDisabledReason =
  (typeof planCreationDisabledReasons)[number];

export class PlanCreationRules {
  static getDisabledReason(
    planType: Pick<PlanType, 'type'> | null | undefined
  ): PlanCreationDisabledReason | undefined {
    // La création reste suspendue jusqu'à l'import de l'annexe 3.
    if (planType?.type === ELECTRIFICATION_PLAN_TYPE) {
      return 'ELECTRIFICATION_CREATION_DISABLED';
    }
    return undefined;
  }

  static isDisabledReason(
    reason: string
  ): reason is PlanCreationDisabledReason {
    return planCreationDisabledReasons.some(
      (disabledReason) => disabledReason === reason
    );
  }
}
