import { DBClient } from '@/api';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { OptionSection } from '@/ui';
import { useQuery } from '@tanstack/react-query';

const fetchPlanTypeListe = async (supabase: DBClient) => {
  const query = supabase.from('plan_action_type').select();

  const { error, data } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return data;
};

/** Renvoie la liste complète des types possibles de plan d'action */
export const usePlanTypeListe = () => {
  const supabase = useSupabase();
  const { data } = useQuery({
    queryKey: ['plan_action_type'],

    queryFn: () => fetchPlanTypeListe(supabase),
  });

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
