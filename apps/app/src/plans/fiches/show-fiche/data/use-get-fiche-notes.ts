import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { FicheWithRelations } from '@tet/domain/plans';

export const useGetFicheNotes = (
  { id: ficheId }: Pick<FicheWithRelations, 'id'>,
  requested = true
) => {
  const trpc = useTRPC();

  return useQuery(
    trpc.plans.fiches.notes.list.queryOptions(
      { ficheId },
      { enabled: requested && !!ficheId }
    )
  );
};
