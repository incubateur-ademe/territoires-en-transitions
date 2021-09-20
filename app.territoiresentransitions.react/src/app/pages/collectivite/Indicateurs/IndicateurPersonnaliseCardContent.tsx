import React from 'react';
import {IndicateurPersonnaliseStorable} from 'storables/IndicateurPersonnaliseStorable';
import {commands} from 'core-logic/commands';
import {
  indicateurPersonnaliseResultatStore,
  indicateurPersonnaliseObjectifStore,
} from 'core-logic/api/hybridStores';
import {IndicateurPersonnaliseTypedInterface} from 'types/IndicateurPersonnaliseMetaTypedInterface';
import {AnyIndicateurLineChartExpandable} from './AnyIndicateurLineChartExpandable';
import {AnyIndicateurEditableExpandPanel} from 'app/pages/collectivite/Indicateurs/AnyIndicateurValues';
import {IndicateurDescriptionPanel} from 'app/pages/collectivite/Indicateurs/IndicateurDescriptionPanel';
import {IndicateurPersonnaliseEditionDialog} from 'app/pages/collectivite/Indicateurs/IndicateurPersonnaliseEditionDialog';

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

export const IndicateurPersonnaliseCardContent = (props: {
  indicateur: IndicateurPersonnaliseStorable;
}) => {
  return (
    <div className="flex flex-col px-5 py-4 bg-beige mb-5">
      <div className="flex flex-row justify-between items-center">
        <h3 className="fr-h3 mb-6">{props.indicateur.nom}</h3>
        <IndicateurPersonnaliseEditionDialog indicateur={props.indicateur} />
      </div>
      <IndicateurDescriptionPanel description={props.indicateur.description} />
      <IndicateurPersonnaliseCommentaire indicateur={props.indicateur} />

      <AnyIndicateurEditableExpandPanel
        store={indicateurPersonnaliseResultatStore}
        indicateurUid={props.indicateur.uid}
        title="Résultats"
      />

      <AnyIndicateurLineChartExpandable
        indicateur={props.indicateur}
        indicateurId={props.indicateur.uid}
        resultatStore={indicateurPersonnaliseResultatStore}
        objectifStore={indicateurPersonnaliseObjectifStore}
      />
    </div>
  );
};
