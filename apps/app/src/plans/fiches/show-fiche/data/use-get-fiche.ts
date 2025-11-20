import { useTRPC } from '@/api/utils/trpc/client';
import { FicheWithRelations } from '@/domain/plans';
import { useQuery } from '@tanstack/react-query';

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
