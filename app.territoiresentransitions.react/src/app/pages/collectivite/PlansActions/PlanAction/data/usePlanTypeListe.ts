import { useQuery } from 'react-query';

import { OptionSection } from '@/ui';

import { supabaseClient } from 'core-logic/api/supabase';

const fetchPlanTypeListe = async () => {
  const query = supabaseClient.from('plan_action_type').select();

  const { error, data } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return data;
};

/** Renvoie la liste complète des types possibles de plan d'action */
export const usePlanTypeListe = () => {
  const { data } = useQuery(['plan_action_type'], () => fetchPlanTypeListe());

  /** Formate la liste pour créer des options avec section */
  const options = data?.reduce((acc: OptionSection[], curr) => {
    /** Ajout des sections */
    if (!acc.some((v) => v.title === curr.categorie)) {
      acc.push({
        title: curr.categorie,
        options: [
          {
            value: curr.id,
            label: `${curr.type}${curr.detail ? ` (${curr.detail})` : ''}`,
          },
        ],
      });
    } else {
      /** Ajout des options dans les sections */
      acc[acc.findIndex((v) => v.title === curr.categorie)].options.push({
        value: curr.id,
        label: `${curr.type}${curr.detail ? ` (${curr.detail})` : ''}`,
      });
    }
    return acc;
  }, []);

  return { data, options };
};
