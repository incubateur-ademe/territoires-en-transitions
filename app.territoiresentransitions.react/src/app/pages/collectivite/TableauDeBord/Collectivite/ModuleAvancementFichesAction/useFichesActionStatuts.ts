import { useCollectiviteId } from 'core-logic/hooks/params';
import { RouterInput, trpc } from 'utils/trpc/client';

type CountByStatutParams =
  RouterInput['plans']['fiches']['countByStatut']['body'];

/** Charge toutes les valeurs associées à un indicateur id (ou à un ou plusieurs identifiants d'indicateurs prédéfinis) */
export const useFichesActionStatuts = (params: CountByStatutParams) => {
  const collectiviteId = useCollectiviteId()!;

  return trpc.plans.fiches.countByStatut.useQuery({
    collectiviteId,
    body: params,
  });
};
