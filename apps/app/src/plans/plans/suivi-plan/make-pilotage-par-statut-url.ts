import { makeCollectivitePlanActionUrl } from '@/app/app/paths';
import { Statut } from '@tet/domain/plans';

export const makePilotageParStatutUrl = ({
  collectiviteId,
  planId,
  statut,
}: {
  collectiviteId: number;
  planId: number;
  statut: Statut | null;
}) =>
  makeCollectivitePlanActionUrl({
    collectiviteId,
    planActionUid: planId.toString(),
    filters: statut ? { statuts: [statut] } : { noStatut: true },
  });
