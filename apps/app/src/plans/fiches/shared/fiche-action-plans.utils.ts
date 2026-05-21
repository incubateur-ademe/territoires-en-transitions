import { FicheListItem } from '../list-all-fiches/data/use-list-fiches';

export function getFicheActionPlanForCollectivite(
  ficheAction: FicheListItem,
  collectiviteId: number
) {
  return (
    ficheAction.plans?.filter((p) => p.collectiviteId === collectiviteId) || []
  );
}
