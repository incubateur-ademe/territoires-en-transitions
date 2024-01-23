import {useQuery} from 'react-query';

import {supabaseClient} from 'core-logic/api/supabase';
import {TOptionSection} from 'ui/shared/select/commons';

const fetchPlanTypeListe = async () => {
  const query = supabaseClient.from('plan_action_type').select();

  const {error, data} = await query;
  if (error) {
    throw new Error(error.message);
  }

  return data;
};

/** Renvoie la liste complète des types possibles de plan d'action */
export const usePlanTypeListe = () => {
  const {data} = useQuery(['plan_action_type'], () => fetchPlanTypeListe());

  const options = data?.reduce((acc: TOptionSection[], curr) => {
    if (!acc.some(v => v.title === curr.categorie)) {
      acc.push({
        title: curr.categorie,
        options: [
          {
            value: curr.id.toString(),
            label: `${curr.type}${curr.detail ? ` (${curr.detail})` : ''}`,
          },
        ],
      });
    } else {
      acc[acc.findIndex(v => v.title === curr.categorie)].options.push({
        value: curr.id.toString(),
        label: `${curr.type}${curr.detail ? ` (${curr.detail})` : ''}`,
      });
    }
    return acc;
  }, []);

  return {data, options};
};
