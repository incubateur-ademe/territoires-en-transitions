import type { PlanType } from '@tet/domain/plans';
import { PcaetImportRules } from '../pcaet/pcaet-import.rules';

/**
 * Libellé du type de plan à donner au modèle. Absent pour un PCAET, un plan
 * sans type ou un type « Autre » : les prompts gardent alors leur cadrage
 * d'origine, celui sur lequel ils ont été évalués.
 */
export const describePlanType = (
  planType: Pick<PlanType, 'categorie' | 'type' | 'detail'> | undefined
): string | undefined => {
  if (
    !planType ||
    PcaetImportRules.appliesTo(planType) ||
    /^autre\b/i.test(planType.type)
  )
    return undefined;
  return planType.detail
    ? `${planType.type} (${planType.detail})`
    : planType.type;
};

/** Complète « plans d'actions … » dans la phrase de rôle d'un prompt. */
export const framePlanScope = (
  original: string,
  planTypeLabel: string | undefined
): string =>
  planTypeLabel === undefined
    ? original
    : `des collectivités ; le document traité est un plan de type « ${planTypeLabel} »`;

/** Complète « un plan d'actions d'une collectivité … » entre parenthèses. */
export const framePlanKind = (
  original: string,
  planTypeLabel: string | undefined
): string =>
  planTypeLabel === undefined
    ? original
    : `(plan de type « ${planTypeLabel} »)`;
