import { PCAET_PLAN_TYPE_KEY } from '@tet/domain/demarches';
import { PlanType } from '@tet/domain/plans';

/** Le programme d'actions PCAET enrichit les fiches avec leurs secteurs. */
export class PcaetImportRules {
  static appliesTo(planType: Pick<PlanType, 'categorie' | 'type'>): boolean {
    return (
      planType.categorie === PCAET_PLAN_TYPE_KEY.categorie &&
      planType.type === PCAET_PLAN_TYPE_KEY.type
    );
  }
}
