import { RouterInput, RouterOutput, trpc } from '@/api/utils/trpc/client';

type ListIndicateurValeursInput = RouterInput['indicateurs']['valeurs']['list'];
type ListIndicateurValeursOutput =
  RouterOutput['indicateurs']['valeurs']['list'];

export type IndicateurSourceData =
  ListIndicateurValeursOutput['indicateurs'][number]['sources'][number];
export type IndicateurSourceValeur = IndicateurSourceData['valeurs'][number];

export const useIndicateurValeurs = (input: ListIndicateurValeursInput) => {
  return trpc.indicateurs.valeurs.list.useQuery(input);
};
