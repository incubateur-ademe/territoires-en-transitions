import React, {useEffect, useState} from 'react';
import {IndicateurValueStorable} from 'storables/IndicateurValueStorable';
import {useAppState} from 'core-logic/overmind';
import {IndicateurPersonnaliseStorable} from 'storables/IndicateurPersonnaliseStorable';
import {commands} from 'core-logic/commands';
import {CrossExpandPanelWithHtmlContent} from 'ui/shared';

const DescriptionPanel = (props: {description: string}) => {
  return (
    <div className={'border-t border-b border-gray-300'}>
      <CrossExpandPanelWithHtmlContent
        title="Description"
        content={props.description}
      />
    </div>
  );
};

const IndicateurPersonnaliseValueInput = (props: {
  year: number;
  indicateur: IndicateurPersonnaliseStorable;
}) => {
  const [value, setValue] = React.useState('');
  const epci_id = useAppState().currentEpciId; // Même remarque que dans le commentaire

  useEffect(() => {
    // todo no need, could do: value = useStorable(valueID, valueStore)
    commands.indicateurCommands
      .getIndicateurPersonnaliseValue(id)
      .then(storable => setValue(storable?.value ?? ''));
  }, [value, epci_id]);

  if (!epci_id) {
    return <div>EPCI ? </div>;
  }

  const id = IndicateurValueStorable.buildId(
    epci_id,
    props.indicateur.id,
    props.year
  );

  const handleChange = (event: React.FormEvent<HTMLInputElement>) => {
    const inputValue = event.currentTarget.value;

    commands.indicateurCommands
      .storeIndicateurPersonnaliseValue(
        new IndicateurValueStorable({
          epci_id: epci_id,
          indicateur_id: props.indicateur.id,
          year: props.year,
          value: inputValue,
        })
      )
      // todo no need, could useStorable(valueID, valueStore)
      .then(storable => setValue(storable.value));
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

const IndicateurPersonnaliseValues = (props: {
  indicateur: IndicateurPersonnaliseStorable;
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
    <div className="flex flex row">
      <button
        className="fr-btn fr-btn--secondary whitespace-nowrap"
        onClick={() => setIndex(index - 1)}
        disabled={index < 1}
      >
        &lt;-
      </button>
      {years.map(year => (
        <IndicateurPersonnaliseValueInput
          year={year}
          indicateur={props.indicateur}
          key={`${props.indicateur.id}-${year}`}
        />
      ))}
      <button
        className="fr-btn fr-btn--secondary whitespace-nowrap"
        onClick={() => setIndex(index + 1)}
      >
        -&gt;
      </button>
    </div>
  );
};

const IndicateurPersonnaliseCommentaire = (props: {
  indicateur: IndicateurPersonnaliseStorable;
}) => {
  const [value, setValue] = React.useState(
    props.indicateur.meta['commentaire'] ?? ''
  );

  function handleSave(
    event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const inputValue = event.currentTarget.value;
    const data = {
      ...props.indicateur,
    };
    data.meta['commentaire'] = inputValue;
    commands.indicateurCommands
      .storeIndicateurPersonnalise(new IndicateurPersonnaliseStorable(data))
      .then(storable => setValue(storable.meta['commentaire']));
  }

  return (
    <div className="CrossExpandPanel">
      <details>
        <summary>Commentaire</summary>
        <textarea
          defaultValue={value}
          onBlur={handleSave}
          className="fr-input mt-2 w-4/5 bg-white p-3 border-b-2 border-gray-500 mr-5"
        />
      </details>
    </div>
  );
};

export const IndicateurPersonnaliseCard = (props: {
  indicateur: IndicateurPersonnaliseStorable;
}) => {
  // todo lookup related actions

  return (
    <div className="flex flex-col px-5 py-4 bg-beige mb-5">
      <div className="flex flex-row justify-between items-center">
        <h3 className="text-xl">{props.indicateur.nom}</h3>
        <span className="bg-yellow-400">todo edit</span>
      </div>
      <IndicateurPersonnaliseValues indicateur={props.indicateur} />
      <div className="h-5" />
      <DescriptionPanel description={props.indicateur.description} />
      <IndicateurPersonnaliseCommentaire indicateur={props.indicateur} />
    </div>
  );
};
