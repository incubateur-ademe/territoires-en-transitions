import {
  ELECTRIFICATION_PLAN_TYPE_KEY,
  PlanType,
} from './plan-type.schema';

export const planCreationDisabledReasons = [
  'ELECTRIFICATION_CREATION_DISABLED',
] as const;

export type PlanCreationDisabledReason =
  (typeof planCreationDisabledReasons)[number];

export class PlanCreationRules {
  static getDisabledReason(
    planType: Pick<PlanType, 'categorie' | 'type'> | null | undefined
  ): PlanCreationDisabledReason | undefined {
    // La création reste suspendue jusqu'à l'import de l'annexe 3.
    if (
      planType?.categorie === ELECTRIFICATION_PLAN_TYPE_KEY.categorie &&
      planType.type === ELECTRIFICATION_PLAN_TYPE_KEY.type
    ) {
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
