import {indicateurResultatRepository} from 'core-logic/api/repositories/AnyIndicateurRepository';
import {AnyIndicateurValueRead} from 'generated/dataLayer/any_indicateur_value_write';
import {useEffect, useState} from 'react';

export const useIndicateurValuesForAllYears = ({
  collectiviteId,
  indicateurId,
}: {
  collectiviteId: number;
  indicateurId: string;
}) => {
  const [indicateurValuesForAllYears, setIndicateurValuesForAllYears] =
    useState<AnyIndicateurValueRead[]>([]);

  useEffect(() => {
    const fetch = async () => {
      console.log('hoooook : fetch !! ');
      const fetched = await indicateurResultatRepository.fetchIndicateurForId({
        collectiviteId,
        indicateurId,
      });
      setIndicateurValuesForAllYears(fetched);
    };
    indicateurResultatRepository.writeEndpoint.addListener(fetch);
    fetch();
    return () => {
      indicateurResultatRepository.writeEndpoint.removeListener(fetch);
    };
  }, [indicateurValuesForAllYears.length]);
  console.log('indicateurValuesForAllYears : ', indicateurValuesForAllYears);
  return indicateurValuesForAllYears;
};
