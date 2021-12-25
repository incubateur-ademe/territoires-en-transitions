import {AnyIndicateurRepository} from 'core-logic/api/repositories/AnyIndicateurRepository';
import {AnyIndicateurValueRead} from 'generated/dataLayer/any_indicateur_value_write';
import {useEffect, useState} from 'react';

export function useAnyIndicateurValuesForAllYears<T extends string | number>({
  collectiviteId,
  indicateurId,
  repo,
}: {
  collectiviteId: number;
  indicateurId: T;
  repo: AnyIndicateurRepository<T>;
}) {
  const [indicateurValuesForAllYears, setIndicateurValuesForAllYears] =
    useState<AnyIndicateurValueRead<T>[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const fetched = await repo.fetchIndicateurValuesForId({
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
}
