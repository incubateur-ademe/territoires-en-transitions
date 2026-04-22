import { useQuery } from '@tanstack/react-query';
import { RouterOutput, useTRPC } from '@tet/api';
import { FicheWithRelations } from '@tet/domain/plans';

export type Fiche = RouterOutput['plans']['fiches']['get'];

export function useGetFiche({
  id,
  initialData,
  enabled,
}: {
  id: number;
  initialData?: FicheWithRelations;
  enabled?: boolean;
}) {
  const trpc = useTRPC();
  return useQuery(
    trpc.plans.fiches.get.queryOptions(
      {
        id,
      },
      {
        initialData,
        enabled,
      }
    )
  );
}
