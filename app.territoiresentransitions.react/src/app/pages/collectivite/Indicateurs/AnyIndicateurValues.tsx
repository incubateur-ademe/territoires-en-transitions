import React, {useEffect, useState} from 'react';
import {useEpciId} from 'core-logic/hooks';
import {AnyIndicateurValueStorable} from 'storables';
import {HybridStore} from 'core-logic/api/hybridStore';
import {useAnyIndicateurValueForYear} from 'core-logic/hooks/indicateurs_values';

// Here we take advantage of IndicateurPersonnaliseValue and IndicateurValue
// having the same shape.

/**
 * Use IndicateurValuesStorageInterface + year to read/write an indicateur value
 */
const AnyIndicateurValueInput = (props: {
  year: number;
  indicateurId: string;
  store: HybridStore<AnyIndicateurValueStorable>;
}) => {
  const epciId = useEpciId()!;

  const value =
    useAnyIndicateurValueForYear(
      props.indicateurId,
      epciId,
      props.year,
      props.store
    )?.value ?? '';

  const handleChange = (event: React.FormEvent<HTMLInputElement>) => {
    const inputValue = event.currentTarget.value;

    props.store.store(
      new AnyIndicateurValueStorable({
        epci_id: epciId,
        indicateur_id: props.indicateurId,
        year: props.year,
        value: inputValue,
      })
    );
  };
  return (
    <label className="flex flex-col mx-2">
      {props.year}
      <input
        className="fr-input mt-2 w-full bg-white p-3 border-b-2 border-gray-500"
        defaultValue={value}
        onBlur={handleChange}
      />
    </label>
  );
};

/**
 * Display a range of inputs for every indicateur yearly values.
 */
export const AnyIndicateurValues = (props: {
  indicateurId: string;
  store: HybridStore<AnyIndicateurValueStorable>;
}) => {
  const min = 2008;
  const stride = 2;
  const window = 7;
  const [index, setIndex] = useState<number>(4);

  const years = Array.from(
    {length: window},
    (v, k) => k + min + stride * index
  );

  return (
    <div className="flex flex row items-center">
      <button
        className="fr-btn fr-btn--secondary"
        onClick={e => {
          e.preventDefault();
          setIndex(index - 1);
        }}
        disabled={index < 1}
      >
        ←
      </button>
      {years.map(year => (
        <AnyIndicateurValueInput
          year={year}
          store={props.store}
          indicateurId={props.indicateurId}
          key={`${props.indicateurId}-${year}`}
        />
      ))}
      <button
        className="fr-btn fr-btn--secondary"
        onClick={e => {
          e.preventDefault();
          setIndex(index + 1);
        }}
      >
        →
      </button>
    </div>
  );
};
