import React from 'react';
import {IndicateurPersonnaliseStorable} from 'storables/IndicateurPersonnaliseStorable';
import {commands} from 'core-logic/commands';
import {IndicateurPersonnaliseInterface} from 'generated/models/indicateur_personnalise';
import {
  indicateurPersonnaliseStore,
  indicateurPersonnaliseValueStore,
} from 'core-logic/api/hybridStores';
import {IndicateurPersonnaliseForm} from 'app/pages/collectivite/Indicateurs/IndicateurPersonnaliseForm';
import {IndicateurPersonnaliseTypedInterface} from 'types/IndicateurPersonnaliseMetaTypedInterface';
import {AnyIndicateurValues} from 'app/pages/collectivite/Indicateurs/AnyIndicateurValues';
import {IndicateurDescriptionPanel} from 'app/pages/collectivite/Indicateurs/IndicateurDescriptionPanel';

const IndicateurPersonnaliseCommentaire = (props: {
  indicateur: IndicateurPersonnaliseTypedInterface;
}) => {
  const [value, setValue] = React.useState(props.indicateur.meta.commentaire);
  const [initialValue, setInitialValue] = React.useState(
    props.indicateur.meta.commentaire
  );
  if (props.indicateur.meta.commentaire !== initialValue) {
    // We use an initial value to update the field value on indicateur change.
    setValue(props.indicateur.meta.commentaire);
    setInitialValue(props.indicateur.meta.commentaire);
  }

  function handleChange(event: React.FormEvent<HTMLTextAreaElement>) {
    const inputValue = event.currentTarget.value;
    setValue(inputValue);
  }

  function handleSave(event: React.FormEvent<HTMLTextAreaElement>) {
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
          value={value}
          onChange={handleChange}
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
  const [editing, setEditing] = React.useState<boolean>(false);

  const onSave = (indicateur: IndicateurPersonnaliseInterface) => {
    indicateurPersonnaliseStore.store(
      new IndicateurPersonnaliseStorable(indicateur)
    );
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="w-2/3 mb-5 border-bf500 border-l-4 pl-4">
        <div className="flex flex-row justify-between">
          <h3 className="fr-h3">{props.indicateur.nom}</h3>
          <button
            className="fr-btn fr-btn--secondary"
            onClick={() => setEditing(false)}
          >
            x
          </button>
        </div>
        <IndicateurPersonnaliseForm
          indicateur={props.indicateur}
          onSave={onSave}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col px-5 py-4 bg-beige mb-5">
      <div className="flex flex-row justify-between items-center">
        <h3 className="text-xl">{props.indicateur.nom}</h3>
        <button
          className="fr-btn fr-btn--secondary"
          onClick={() => setEditing(true)}
        >
          Modifier l'indicateur
        </button>
      </div>
      <AnyIndicateurValues
        storage={{
          indicateurId: props.indicateur.id,
          store: indicateurPersonnaliseValueStore,
        }}
      />
      <div className="h-5" />
      <IndicateurDescriptionPanel description={props.indicateur.description} />
      <IndicateurPersonnaliseCommentaire indicateur={props.indicateur} />
    </div>
  );
};
