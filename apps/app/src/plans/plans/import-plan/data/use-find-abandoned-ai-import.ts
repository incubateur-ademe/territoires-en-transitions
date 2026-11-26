import { skipToken, useQuery } from '@tanstack/react-query';
import { RouterOutput, useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';

export type AbandonedAiImport = NonNullable<
  RouterOutput['plans']['aiImport']['findAbandonedAiImport']
>;

/**
 * Le dernier import du fichier, quand l'IA l'a abandonné : relancer le même
 * document referait le même abandon, il faut l'expliquer.
 */
export const useFindAbandonedAiImport = ({
  fichierId,
}: {
  fichierId?: number;
}): { abandonedImport: AbandonedAiImport | null; isLoading: boolean } => {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();

  const { data, isLoading } = useQuery(
    trpc.plans.aiImport.findAbandonedAiImport.queryOptions(
      fichierId !== undefined ? { collectiviteId, fichierId } : skipToken,
      { staleTime: 0 }
    )
  );

  return {
    abandonedImport: fichierId !== undefined ? data ?? null : null,
    isLoading: fichierId !== undefined && isLoading,
  };
};
