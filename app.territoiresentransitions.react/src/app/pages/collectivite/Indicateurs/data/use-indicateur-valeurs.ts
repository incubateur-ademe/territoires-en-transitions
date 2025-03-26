import { RouterInput, RouterOutput, trpc } from '@/api/utils/trpc/client';

type ListIndicateurValeursInput = RouterInput['indicateurs']['valeurs']['list'];
export type ListIndicateurValeursOutput =
  RouterOutput['indicateurs']['valeurs']['list'];

export type IndicateurSources =
  ListIndicateurValeursOutput['indicateurs'][number];

export type IndicateurSourceData = IndicateurSources['sources'][number];
export type IndicateurSourceValeur = IndicateurSourceData['valeurs'][number];

export const useIndicateurValeurs = (input: ListIndicateurValeursInput) => {
  return trpc.indicateurs.valeurs.list.useQuery(input, {
    enabled: Boolean(
      input.indicateurIds?.length || input.identifiantsReferentiel?.length
    ),
  });
};
