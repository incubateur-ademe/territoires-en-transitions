import { useCollectiviteId } from 'core-logic/hooks/params';
import { RouterInput, trpc } from 'utils/trpc/client';

export type GetFichesActionStatutsParams =
  RouterInput['plans']['fiches']['countByStatut']['body'];

type Body = GetFichesActionStatutsParams;

/** Charge toutes les valeurs associées à un indicateur id (ou à un ou plusieurs identifiants d'indicateurs prédéfinis) */
export const useFichesActionStatuts = (params: Body) => {
  const collectiviteId = useCollectiviteId()!;

  return trpc.plans.fiches.countByStatut.useQuery({
    collectiviteId,
    body: params,
  });
};
