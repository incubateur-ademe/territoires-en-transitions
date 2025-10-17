import {
  makeCollectiviteFicheNonClasseeUrl,
  makeCollectivitePlanActionFicheUrl,
} from '@/app/app/paths';
import { FicheResume } from '@/domain/plans';

export function getFichePageUrlForCollectivite({
  fiche,
  collectiviteId,
}: {
  collectiviteId: number;
  fiche: Pick<FicheResume, 'id' | 'plans'>;
}) {
  const foundPlan = fiche.plans?.find(
    (plan) => plan.collectiviteId === collectiviteId
  );
  if (foundPlan) {
    return makeCollectivitePlanActionFicheUrl({
      collectiviteId,
      ficheUid: fiche.id.toString(),
      planActionUid: foundPlan.id.toString(),
    });
  }
  return makeCollectiviteFicheNonClasseeUrl({
    collectiviteId,
    ficheUid: fiche.id.toString(),
  });
}
