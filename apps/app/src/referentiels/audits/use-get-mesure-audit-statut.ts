import { useCollectiviteId } from '@/api/collectivites';
import { RouterOutput, useTRPC } from '@/api/utils/trpc/client';
import { useQuery } from '@tanstack/react-query';

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
