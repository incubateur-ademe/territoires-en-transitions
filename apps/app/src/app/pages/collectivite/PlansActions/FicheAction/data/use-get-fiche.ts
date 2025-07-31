import { RouterOutput, useTRPC } from '@/api/utils/trpc/client';
import { useQuery } from '@tanstack/react-query';

export type Fiche = RouterOutput['plans']['fiches']['get'];

export function useGetFiche({
  id,
  initialData,
}: {
  id: number;
  initialData?: Fiche;
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
