import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

export const useGetFicheSecteurs = (ficheId: number) => {
  const trpc = useTRPC();
  return useQuery(trpc.plans.fiches.getSecteurs.queryOptions({ ficheId }));
};
