import { RouterInput, trpc } from '@/api/utils/trpc/client';
import { useCollectiviteId } from '@/app/core-logic/hooks/params';

type CountByStatutFilter =
  RouterInput['plans']['fiches']['countByStatut']['filter'];

/** Charge toutes les valeurs associées à un indicateur id (ou à un ou plusieurs identifiants d'indicateurs prédéfinis) */
export const useFichesActionStatuts = (params: CountByStatutFilter) => {
  const collectiviteId = useCollectiviteId()!;

  return trpc.plans.fiches.countByStatut.useQuery({
    collectiviteId,
    filter: params,
  });
};
