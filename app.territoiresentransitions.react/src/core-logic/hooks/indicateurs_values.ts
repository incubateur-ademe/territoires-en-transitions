import {HybridStore} from 'core-logic/api/hybridStore';
import * as R from 'ramda';
import {useEffect, useState} from 'react';
import {AnyIndicateurValueStorable} from 'storables';
import {inferValueIndicateurUid} from 'utils/referentiels';

export const useAnyIndicateurValueForYearOnce = (
  indicateurUid: string,
  epciId: string,
  year: number,
  store: HybridStore<AnyIndicateurValueStorable>
) => {
  const [value, setValue] = useState<AnyIndicateurValueStorable | null>(null);
  const valueIndicateurUid = inferValueIndicateurUid(indicateurUid);

  const storableId = AnyIndicateurValueStorable.buildId(
    epciId,
    valueIndicateurUid,
    year
  );
  useEffect(() => {
    store.retrieveById(storableId).then(storable => {
      if (!value || !value.equals(storable)) setValue(storable);
    });
  });

  return value;
};

export const useAnyIndicateurValueForAllYears = (
  indicateurUid: string,
  epciId: string,
  store: HybridStore<AnyIndicateurValueStorable>
) => {
  const [valuesForYears, setValuesForYears] = useState<
    AnyIndicateurValueStorable[]
  >([]);

  const valueIndicateurUid = inferValueIndicateurUid(indicateurUid);

  useEffect(() => {
    const listener = async () => {
      const values = await store.retrieveAtPath(
        `${epciId}/${valueIndicateurUid}`
      );
      setValuesForYears(values);
    };

    store
      .retrieveAtPath(`${epciId}/${valueIndicateurUid}`)
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
