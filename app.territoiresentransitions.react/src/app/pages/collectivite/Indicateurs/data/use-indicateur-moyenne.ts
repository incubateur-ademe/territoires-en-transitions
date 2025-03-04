import { RouterInput, RouterOutput, trpc } from '@/api/utils/trpc/client';

type IndicateurMoyenneInput = RouterInput['indicateurs']['valeurs']['average'];
export type IndicateurMoyenneOutput =
  RouterOutput['indicateurs']['valeurs']['average'];

export const useIndicateurMoyenne = (input: IndicateurMoyenneInput) => {
  return trpc.indicateurs.valeurs.average.useQuery(input);
};
