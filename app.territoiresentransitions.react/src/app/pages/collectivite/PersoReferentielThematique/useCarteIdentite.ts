import {useEffect, useState} from 'react';
import {CarteIdentiteRead} from 'generated/dataLayer/carte_identite_read';
import {carteIdentiteReadEndpoint} from 'core-logic/api/endpoints/CarteIdentititeReadEndpoint';

type TUseCarteIdentite = (collectivite_id?: number) => CarteIdentiteRead | null;

export const useCarteIdentite: TUseCarteIdentite = collectivite_id => {
  const [data, setData] = useState<CarteIdentiteRead | null>(null);

  // charge les données
  const fetch = async () => {
    if (collectivite_id) {
      const results = await carteIdentiteReadEndpoint.getBy({
        collectivite_id,
      });

      setData(results?.length > 0 ? results[0] : null);
    }
  };
  useEffect(() => {
    fetch();
  }, [collectivite_id]);

  return data;
};
