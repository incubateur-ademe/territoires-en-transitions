import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { RouterInput, useTRPC } from '@tet/api';

export const useGetEvolutionStatuts = (
  input: RouterInput['plans']['suivi']['getEvolutionStatuts'] & {
    dateDebut: string;
    dateFin: string;
  }
) => {
  const trpc = useTRPC();
  return useQuery({
    ...trpc.plans.suivi.getEvolutionStatuts.queryOptions(input, {
      staleTime: 0,
    }),
    placeholderData: keepPreviousData,
    enabled: input.dateDebut <= input.dateFin,
  });
};
