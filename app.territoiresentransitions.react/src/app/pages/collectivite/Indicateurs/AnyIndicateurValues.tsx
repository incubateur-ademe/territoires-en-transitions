import {HybridStore} from 'core-logic/api/hybridStore';
import React, {useEffect, useState} from 'react';
import {useEpciId} from 'core-logic/hooks';
import {IndicateurValue} from 'generated/models/indicateur_value';
import {IndicateurPersonnaliseValue} from 'generated/models/indicateur_personnalise_value';
import {indicateurValueStore} from 'core-logic/api/hybridStores';
import {IndicateurReferentiel} from 'generated/models/indicateur_referentiel';

// Here we take advantage of IndicateurPersonnaliseValue and IndicateurValue
// having the same shape.

/**
 * AnyIndicateurValues requirement.
 */
interface IndicateurValuesStorageInterface {
  indicateurId: string;
  store: HybridStore<AnyIndicateurValueStorable>;
}

/**
 * Join IndicateurValue and IndicateurPersonnaliseValue in a concrete class.
 */
export class AnyIndicateurValueStorable
  extends IndicateurValue
  implements IndicateurPersonnaliseValue
{
  static buildId(epci_id: string, indicateur_id: string, year: number): string {
    return `${epci_id}/${indicateur_id}/${year}`;
  }

  get id(): string {
    return AnyIndicateurValueStorable.buildId(
      this.epci_id,
      this.indicateur_id,
      this.year
    );
  }
}

/**
 * Use IndicateurValuesStorageInterface + year to read/write an indicateur value
 */
const AnyIndicateurValueInput = (props: {
  year: number;
  storage: IndicateurValuesStorageInterface;
}) => {
  const [value, setValue] = React.useState<number | null>(null);
  const epciId = useEpciId()!;

  useEffect(() => {
    props.storage.store
      .retrieveById(
        AnyIndicateurValueStorable.buildId(
          epciId,
          props.storage.indicateurId,
          props.year
        )
      )
      .then(storable => setValue(storable?.value ?? null));
  }, [value, epciId]);

  const handleChange = (event: React.FormEvent<HTMLInputElement>) => {
    const inputValue = event.currentTarget.value;
    const floatValue = parseFloat(inputValue.replace(',', '.'));

    props.storage.store
      .store(
        new AnyIndicateurValueStorable({
          epci_id: epciId,
          indicateur_id: props.storage.indicateurId,
          year: props.year,
          value: floatValue,
        })
      )
      .then(storable => {
        console.log('storable.value', storable);

        return setValue(storable.value);
      });
  };
  return (
    <label className="flex flex-col mx-2 ">
      {props.year}
      <input
        className="fr-input mt-2 w-full bg-white p-3 border-b-2 border-gray-500 text-sm font-normal text-gray-500"
        defaultValue={value || ''}
        onBlur={handleChange}
        type="number"
      />
    </label>
  );
};

/**
 * Display a range of inputs for every indicateur yearly values.
 */
const AnyIndicateurValues = (props: {
  storage: IndicateurValuesStorageInterface;
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
            storage={props.storage}
            key={`${props.storage.indicateurId}-${year}`}
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
  storage: IndicateurValuesStorageInterface;
  title: string;
}) => (
  <div className="CrossExpandPanel editable">
    <details>
      <summary className="title">{props.title}</summary>
      <div>
        <AnyIndicateurValues storage={props.storage} />
      </div>
    </details>
  </div>
);
