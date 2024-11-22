import { useCollectiviteId } from 'core-logic/hooks/params';
import { RouterInput, trpc } from '@tet/api/utils/trpc/client';

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
