import {HybridStore} from 'core-logic/api/hybridStore';
import * as R from 'ramda';
import {useEffect, useState} from 'react';
import {AnyIndicateurValueStorable} from 'storables';
import {inferValueIndicateurUid} from 'utils/referentiels';

export const useAnyIndicateurValueForAllYears = (
  indicateurUid: string,
  collectiviteId: number,
  store: HybridStore<AnyIndicateurValueStorable>
) => {
  const [valuesForYears, setValuesForYears] = useState<
    AnyIndicateurValueStorable[]
  >([]);

  const valueIndicateurUid = inferValueIndicateurUid(indicateurUid);

  useEffect(() => {
    const listener = async () => {
      const values = await store.retrieveAtPath(
        `${collectiviteId}/${valueIndicateurUid}`
      );
      setValuesForYears(values);
    };

    store
      .retrieveAtPath(`${collectiviteId}/${valueIndicateurUid}`)
      .then(previousStoredValues => {
        if (
          valuesForYears.length !== previousStoredValues.length ||
          !valuesForYears.every((element, index) =>
            element.equals(previousStoredValues[index])
          )
        )
          setValuesForYears(previousStoredValues);
      });
    store.addListener(listener);
    return () => {
      store.removeListener(listener);
    };
  });

  return R.sortBy(R.prop('year'), valuesForYears);
};
