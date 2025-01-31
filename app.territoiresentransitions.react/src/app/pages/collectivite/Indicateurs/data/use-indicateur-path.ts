import { RouterInput, RouterOutput, trpc } from '@/api/utils/trpc/client';

type GetPathInput = RouterInput['indicateurs']['definitions']['getPath'];
export type GetPathOutput =
  RouterOutput['indicateurs']['definitions']['getPath'];

export const useIndicateurPath = (input: GetPathInput) => {
  return trpc.indicateurs.definitions.getPath.useQuery(input);
};
