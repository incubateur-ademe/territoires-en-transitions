import { RouterInput, RouterOutput, useTRPC } from '@/api/utils/trpc/client';
import { useQuery } from '@tanstack/react-query';

type GetPathInput = RouterInput['indicateurs']['definitions']['getPath'];
export type GetPathOutput =
  RouterOutput['indicateurs']['definitions']['getPath'];

export const useIndicateurPath = (input: GetPathInput) => {
  const trpc = useTRPC();
  return useQuery(trpc.indicateurs.definitions.getPath.queryOptions(input));
};
