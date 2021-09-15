import React, {useEffect} from 'react';
import {IndicateurReferentiel} from 'generated/models/indicateur_referentiel';
import {commands} from 'core-logic/commands';
import {IndicateurReferentielCommentaireStorable} from 'storables/IndicateurReferentielCommentaireStorable';
import {IndicateurDescriptionPanel} from 'app/pages/collectivite/Indicateurs/IndicateurDescriptionPanel';
import {AnyIndicateurEditableExpandPanel} from 'app/pages/collectivite/Indicateurs/AnyIndicateurValues';
import {indicateurValueStore} from 'core-logic/api/hybridStores';
import {useEpciId} from 'core-logic/hooks';
import {AnyIndicateurLineChartExpandable} from './AnyIndicateurLineChartExpandable';

const Commentaire = (props: {indicateur: IndicateurReferentiel}) => {
  const [value, setValue] = React.useState('');
  const epciId = useEpciId()!;

  const id = IndicateurReferentielCommentaireStorable.buildId(
    epciId,
    props.indicateur.id
  );

  useEffect(() => {
    commands.indicateurCommands
      .getIndicateurReferentielCommentaire(id)
      .then(storable => setValue(storable?.value ?? ''));
  }, [value, epciId]);

  const handleSave = (event: React.FormEvent<HTMLTextAreaElement>) => {
    const inputValue = event.currentTarget.value;
    commands.indicateurCommands.storeIndicateurReferentielCommentaire(
      new IndicateurReferentielCommentaireStorable({
        epci_id: epciId,
        indicateur_id: props.indicateur.id,
        value: inputValue,
      })
    );
  };

  return (
    <div className="CrossExpandPanel editable">
      <details>
        <summary>Commentaire</summary>
        <div>
          <textarea
            defaultValue={value}
            onBlur={handleSave}
            className="fr-input mt-2 w-4/5 bg-white p-3 border-b-2 border-gray-500 mr-5"
          />
        </div>
      </details>
    </div>
  );
};

export const IndicateurReferentielCard = (props: {
  indicateur: IndicateurReferentiel;
}) => {
  return (
    <div className="flex flex-col px-5 py-4 bg-beige mb-5">
      <h3 className="fr-h3 mb-6">{props.indicateur.nom}</h3>

      <IndicateurDescriptionPanel description={props.indicateur.description} />
      <AnyIndicateurEditableExpandPanel
        storage={{
          indicateurId: props.indicateur.id,
          store: indicateurValueStore,
        }}
        title="Objectifs"
      />
      <AnyIndicateurEditableExpandPanel
        storage={{
          indicateurId: props.indicateur.id,
          store: indicateurValueStore,
        }}
        title="Résultats"
      />
      <Commentaire indicateur={props.indicateur} />
      <AnyIndicateurLineChartExpandable
        indicateur={props.indicateur}
        resultatStore={indicateurValueStore}
      />
    </div>
  );
};
