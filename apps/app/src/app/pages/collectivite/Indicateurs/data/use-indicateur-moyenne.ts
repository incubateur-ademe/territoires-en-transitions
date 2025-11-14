import { RouterInput, RouterOutput, useTRPC } from '@/api';
import { useQuery } from '@tanstack/react-query';

type IndicateurMoyenneInput = RouterInput['indicateurs']['valeurs']['average'];
export type IndicateurMoyenneOutput =
  RouterOutput['indicateurs']['valeurs']['average'];

export const useIndicateurMoyenne = (input: IndicateurMoyenneInput) => {
  const trpc = useTRPC();
  return useQuery(trpc.indicateurs.valeurs.average.queryOptions(input));
};
