import { RouterOutput, trpc } from '@/api/utils/trpc/client';

export type Fiche = RouterOutput['plans']['fiches']['get'];

export function useGetFiche(ficheId: number) {
  return trpc.plans.fiches.get.useQuery({
    id: ficheId,
  });
}
