import React, {useState} from 'react';
import {useEpciId} from 'core-logic/hooks';
import {AnyIndicateurValueStorable} from 'storables';
import {HybridStore} from 'core-logic/api/hybridStore';
import {useAnyIndicateurValueForYear} from 'core-logic/hooks/indicateurs_values';
import {commands} from 'core-logic/commands';

// Here we take advantage of IndicateurPersonnaliseValue and IndicateurValue
// having the same shape.

/**
 * Use IndicateurValuesStorageInterface + year to read/write an indicateur value
 */
const AnyIndicateurValueInput = (props: {
  year: number;
  indicateurUid: string;
  store: HybridStore<AnyIndicateurValueStorable>;
}) => {
  const epciId = useEpciId()!;

  const value =
    useAnyIndicateurValueForYear(
      props.indicateurUid,
      epciId,
      props.year,
      props.store
    )?.value ?? '';

  const [inputValue, setInputValue] = useState<string | number>(value);

  const handleChange = (event: React.FormEvent<HTMLInputElement>) => {
    const inputValue = event.currentTarget.value;

    const floatValue = parseFloat(inputValue.replace(',', '.'));
    commands.indicateurCommands.storeAnyIndicateurValue({
      store: props.store,
      interface: {
        epci_id: epciId,
        indicateur_id: props.indicateurUid,
        year: props.year,
        value: floatValue,
      },
    });
  };
  setInputValue(inputValue || '');
  return (
    <label className="flex flex-col mx-2 ">
      {props.year}
      <input
        className="fr-input mt-2 w-full bg-white p-3 border-b-2 border-gray-500 text-sm font-normal text-gray-500"
        value={inputValue}
        onChange={handleChange}
      />
    </label>
  );
};

/**
 * Display a range of inputs for every indicateur yearly values.
 */
export const AnyIndicateurValues = (props: {
  indicateurUid: string;
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
    <div className="flex row items-center h-full text-center">
      <button
        className="fr-fi-arrow-left-line fr-btn--icon-left"
        onClick={e => {
          e.preventDefault();
          setIndex(index - 1);
        }}
        disabled={index < 1}
      />
      <div className="flex row items-center">
        {years.map(year => (
          <AnyIndicateurValueInput
            year={year}
            store={props.store}
            indicateurUid={props.indicateurUid}
            key={`${props.indicateurUid}-${year}`}
          />
        ))}
      </div>
      <button
        className="fr-fi-arrow-right-line fr-btn--icon-left pl-4"
        onClick={e => {
          e.preventDefault();
          setIndex(index + 1);
        }}
      />
    </div>
  );
};

/**
 * Expand Panel with range of value inputs as details
 */
export const AnyIndicateurEditableExpandPanel = (props: {
  indicateurUid: string;
  store: HybridStore<AnyIndicateurValueStorable>;
  title: string;
}) => (
  <div className="CrossExpandPanel editable">
    <details>
      <summary className="title">{props.title}</summary>
      <div>
        <AnyIndicateurValues
          store={props.store}
          indicateurUid={props.indicateurUid}
        />
      </div>
    </details>
  </div>
);
