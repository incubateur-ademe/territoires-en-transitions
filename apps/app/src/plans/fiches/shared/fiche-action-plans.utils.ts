import { FicheListItem } from '../list-all-fiches/data/use-list-fiches';

export function getFicheActionPlanForCollectivite(
  ficheAction: FicheListItem,
  collectiviteId: number
) {
  return (
    ficheAction.plans?.filter((p) => p.collectiviteId === collectiviteId) || []
  );
}

export function getFirstFicheActionPlanForCollectivite(
  ficheAction: FicheListItem,
  collectiviteId: number
) {
  const plans = getFicheActionPlanForCollectivite(ficheAction, collectiviteId);
  return plans.length > 0 ? plans[0] : null;
}
