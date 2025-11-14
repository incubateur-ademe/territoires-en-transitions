import { useTRPC } from '@/api/utils/trpc/client';
import { useQuery } from '@tanstack/react-query';
import { RouterOutput } from '@tet/api';
import { FicheWithRelations } from '@tet/domain/plans';

export type Fiche = RouterOutput['plans']['fiches']['get'];

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
