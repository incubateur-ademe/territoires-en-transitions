import { RouterInput, RouterOutput, useTRPC } from '@/api/utils/trpc/client';
import { useQuery } from '@tanstack/react-query';

type ListIndicateurValeursInput = RouterInput['indicateurs']['valeurs']['list'];
export type ListIndicateurValeursOutput =
  RouterOutput['indicateurs']['valeurs']['list'];

export type IndicateurSources =
  ListIndicateurValeursOutput['indicateurs'][number];

export type IndicateurSourceData = IndicateurSources['sources'][number];
export type IndicateurSourceValeur = IndicateurSourceData['valeurs'][number];

export const useIndicateurValeurs = (input: ListIndicateurValeursInput) => {
  const trpc = useTRPC();
  return useQuery(
    trpc.indicateurs.valeurs.list.queryOptions(input, {
      enabled: Boolean(
        input.indicateurIds?.length || input.identifiantsReferentiel?.length
      ),
    })
  );
};
