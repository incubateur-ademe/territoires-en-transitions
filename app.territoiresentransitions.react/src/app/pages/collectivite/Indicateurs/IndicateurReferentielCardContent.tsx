import React, {useEffect} from 'react';
import {IndicateurReferentiel} from 'generated/models/indicateur_referentiel';
import {commands} from 'core-logic/commands';
import {IndicateurReferentielCommentaireStorable} from 'storables/IndicateurReferentielCommentaireStorable';
import {IndicateurDescriptionPanel} from 'app/pages/collectivite/Indicateurs/IndicateurDescriptionPanel';
import {AnyIndicateurEditableExpandPanel} from 'app/pages/collectivite/Indicateurs/AnyIndicateurValues';
import {
  indicateurObjectifStore,
  indicateurResultatStore,
} from 'core-logic/api/hybridStores';
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

export const IndicateurReferentielCardContent = (props: {
  indicateur: IndicateurReferentiel;
}) => {
  return (
    <div>
      <IndicateurDescriptionPanel description={props.indicateur.description} />
      <Commentaire indicateur={props.indicateur} />
      <AnyIndicateurEditableExpandPanel
        store={indicateurObjectifStore}
        indicateurUid={props.indicateur.uid}
        title="Objectifs"
      />
      <AnyIndicateurEditableExpandPanel
        store={indicateurResultatStore}
        indicateurUid={props.indicateur.uid}
        title="Résultats"
      />

      <AnyIndicateurLineChartExpandable
        indicateur={props.indicateur}
        indicateurId={props.indicateur.id}
        resultatStore={indicateurResultatStore}
        objectifStore={indicateurObjectifStore}
      />
    </div>
  );
};
