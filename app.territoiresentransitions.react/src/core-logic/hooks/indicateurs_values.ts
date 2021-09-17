import {HybridStore} from 'core-logic/api/hybridStore';
import {getFicheActionStoreForEpci} from 'core-logic/api/hybridStores';
import * as R from 'ramda';
import {useEffect, useState} from 'react';
import {AnyIndicateurValueStorable} from 'storables';

export const useAnyIndicateurValueForYear = (
  indicateurId: string,
  epciId: string,
  year: number,
  store: HybridStore<AnyIndicateurValueStorable>
) => {
  const [value, setValue] = useState<AnyIndicateurValueStorable | null>(null);

  const storableId = AnyIndicateurValueStorable.buildId(
    epciId,
    indicateurId,
    year
  );
  useEffect(() => {
    const listener = async () => {
      const value = await store.retrieveById(storableId);
      setValue(value);
    };

    store.retrieveById(storableId).then(storable => {
      if (!value || !value.equals(storable)) setValue(storable);
    });
    store.addListener(listener);
    return () => {
      store.removeListener(listener);
    };
  });

  return value;
};

export const useAnyIndicateurValueForAllYears = (
  indicateurId: string,
  epciId: string,
  store: HybridStore<AnyIndicateurValueStorable>
) => {
  const [valuesForYears, setValuesForYears] = useState<
    AnyIndicateurValueStorable[]
  >([]);

  useEffect(() => {
    const listener = async () => {
      const values = await store.retrieveAtPath(`${epciId}/${indicateurId}`);
      setValuesForYears(values);
    };

    store
      .retrieveAtPath(`${epciId}/${indicateurId}`)
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
