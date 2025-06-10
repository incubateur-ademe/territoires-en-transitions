import { FicheResume } from '@/domain/plans/fiches';

export function getFicheActionPlanForCollectivite(
  ficheAction: FicheResume,
  collectiviteId: number
) {
  return (
    ficheAction.plans?.filter((p) => p.collectiviteId === collectiviteId) || []
  );
}

export function getFirstFicheActionPlanForCollectivite(
  ficheAction: FicheResume,
  collectiviteId: number
) {
  const plans = getFicheActionPlanForCollectivite(ficheAction, collectiviteId);
  return plans.length > 0 ? plans[0] : null;
}
