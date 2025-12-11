import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { FicheWithRelations } from '@tet/domain/plans';

export function useGetFiche({
  id,
  initialData,
}: {
  id: number;
  initialData?: FicheWithRelations;
}) {
  const trpc = useTRPC();
  return useQuery(
    trpc.plans.fiches.get.queryOptions(
      {
        id,
      },
      {
        initialData,
      }
    )
  );
}
