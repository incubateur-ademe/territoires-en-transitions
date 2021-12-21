import {AnyIndicateurRepository} from 'core-logic/api/repositories/AnyIndicateurRepository';
import {AnyIndicateurValueRead} from 'generated/dataLayer/any_indicateur_value_write';
import {useEffect, useState} from 'react';

export const useAnyIndicateurValuesForAllYears = ({
  collectiviteId,
  indicateurId,
  repo,
}: {
  collectiviteId: number;
  indicateurId: string;
  repo: AnyIndicateurRepository;
}) => {
  const [indicateurValuesForAllYears, setIndicateurValuesForAllYears] =
    useState<AnyIndicateurValueRead[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const fetched = await repo.fetchIndicateurForId({
        collectiviteId,
        indicateurId,
      });
      setIndicateurValuesForAllYears(fetched);
    };
    repo.writeEndpoint.addListener(fetch);
    fetch();
    return () => {
      repo.writeEndpoint.removeListener(fetch);
    };
  }, [JSON.stringify(indicateurValuesForAllYears)]);
  return indicateurValuesForAllYears;
};
