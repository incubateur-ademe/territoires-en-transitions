import { useQuery } from '@tanstack/react-query';
import { RouterOutput, useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';

export type MesureAuditStatut =
  RouterOutput['referentiels']['labellisations']['getMesureAuditStatut'];

export const useGetMesureAuditStatut = ({
  mesureId,
  enabled = true,
}: {
  mesureId: string;
  enabled: boolean;
}) => {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();

  return useQuery(
    trpc.referentiels.labellisations.getMesureAuditStatut.queryOptions(
      {
        collectiviteId,
        mesureId,
      },
      { enabled }
    )
  );
};
