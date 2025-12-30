import { useQuery } from '@tanstack/react-query';
import { RouterInput, RouterOutput, useTRPC } from '@tet/api';

type GetPathInput = RouterInput['indicateurs']['indicateurs']['getPath'];
export type GetPathOutput =
  RouterOutput['indicateurs']['indicateurs']['getPath'];

export const useIndicateurPath = (input: GetPathInput) => {
  const trpc = useTRPC();
  return useQuery(trpc.indicateurs.indicateurs.getPath.queryOptions(input));
};
