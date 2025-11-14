import { useQuery } from '@tanstack/react-query';

import { useSupabase } from '@/api';
import { makeCollectivitePlanActionUrl } from '@/app/app/paths';
import { TAxeRow } from '@/app/types/alias';
import { generateTitle } from '../../FicheAction/data/utils';

type FilArianeLink = {
  label: string;
  href?: string;
};

type FilArianeArgs = {
  collectiviteId: number;
  chemin: TAxeRow[];
  titreFiche: string;
};

export const generateFilArianeLinks = ({
  collectiviteId,
  chemin,
  titreFiche,
}: FilArianeArgs): FilArianeLink[] => {
  return [
    ...chemin.map((axe, i) => {
      return {
        label: generateTitle(axe.nom),
        href: makeCollectivitePlanActionUrl({
          collectiviteId,
          planActionUid: chemin[0].id.toString(),
          openAxes: chemin
            .filter((_, index) => index <= i)
            .map((axe) => axe.id),
        }),
      };
    }),
    { label: generateTitle(titreFiche) },
  ];
};

/**
 * Récupère les parents d'un axe dans un plan.
 * Renvoi l'id du plan et l'id de la collectivité
 * ainsi que le chemin jusqu'à l'axe donné.
 */
export const usePlanActionChemin = (axe_id: number) => {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ['plan_action_chemin', axe_id],

    queryFn: async () => {
      const { data } = await supabase
        .from('plan_action_chemin')
        .select()
        .eq('axe_id', axe_id);
      return data && data[0];
    },
  });
};

export const useFicheActionChemins = (axesIds: number[]) => {
  const supabase = useSupabase();

  const { data, isLoading } = useQuery({
    queryKey: ['fiche_action_chemins', axesIds],

    queryFn: async () => {
      return await supabase
        .from('plan_action_chemin')
        .select()
        .in('axe_id', axesIds);
    },
  });

  return { data: data?.data, isLoading };
};
