import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

export const useGetEvolutionStatuts = (input: {
  planId: number;
  thematiqueIds: number[];
  dateDebut: string;
  dateFin: string;
  inclureActionsContinues: boolean;
}) => {
  const trpc = useTRPC();
  return useQuery({
    ...trpc.plans.suivi.getEvolutionStatuts.queryOptions(input, {
      staleTime: 0,
    }),
    placeholderData: keepPreviousData,
    enabled: input.dateDebut <= input.dateFin,
  });
};
