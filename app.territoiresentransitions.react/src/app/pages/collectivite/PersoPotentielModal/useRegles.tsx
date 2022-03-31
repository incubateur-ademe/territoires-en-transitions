import {useEffect, useState} from 'react';
import {TPersonnalisationRegleRead} from 'generated/dataLayer/personnalisation_regle_read';
import {personnalisationRegleReadEndpoint} from 'core-logic/api/endpoints/PersonnalisationRegleReadEndpoint';

type TUseRegles = (action_id: string) => TPersonnalisationRegleRead[];

// charge les règles de personnalisation pour une action donnée
export const useRegles: TUseRegles = action_id => {
  const [data, setData] = useState<TPersonnalisationRegleRead[]>([]);

  const fetch = async () => {
    if (action_id) {
      const regles = await personnalisationRegleReadEndpoint.getBy({
        action_id,
      });

      setData(regles);
    }
  };

  useEffect(() => {
    fetch();
  }, [action_id]);

  return data;
};
