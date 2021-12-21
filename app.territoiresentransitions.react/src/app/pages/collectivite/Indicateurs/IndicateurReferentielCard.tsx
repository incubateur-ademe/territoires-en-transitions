import React, {useEffect} from 'react';
import {IndicateurReferentiel} from 'generated/models/indicateur_referentiel';
import {commands} from 'core-logic/commands';
import {IndicateurReferentielCommentaireStorable} from 'storables/IndicateurReferentielCommentaireStorable';
import {IndicateurDescriptionPanel} from 'app/pages/collectivite/Indicateurs/IndicateurDescriptionPanel';
import {AnyIndicateurEditableExpandPanel} from 'app/pages/collectivite/Indicateurs/AnyIndicateurValues';

import {useCollectiviteId} from 'core-logic/hooks';
import {AnyIndicateurLineChartExpandable} from './AnyIndicateurLineChartExpandable';
import {inferIndicateurReferentielAndTitle} from 'utils/indicateurs';
import {AnyIndicateurCard} from 'app/pages/collectivite/Indicateurs/AnyIndicateurCard';
import {Editable} from 'ui/shared';
import {
  indicateurObjectifRepository,
  indicateurResultatRepository,
} from 'core-logic/api/repositories/AnyIndicateurRepository';

const Commentaire = (props: {indicateur: IndicateurReferentiel}) => {
  const [value, setValue] = React.useState('');
  const collectiviteId = useCollectiviteId()!;

  const id = IndicateurReferentielCommentaireStorable.buildId(
    collectiviteId.toString(),
    props.indicateur.id
  );

  useEffect(() => {
    commands.indicateurCommands
      .getIndicateurReferentielCommentaire(id)
      .then(storable => setValue(storable?.value ?? ''));
  }, [value, collectiviteId]);

  const handleSave = (event: React.FormEvent<HTMLTextAreaElement>) => {
    const inputValue = event.currentTarget.value;
    commands.indicateurCommands.storeIndicateurReferentielCommentaire(
      new IndicateurReferentielCommentaireStorable({
        epci_id: collectiviteId.toString(),
        indicateur_id: props.indicateur.id,
        value: inputValue,
      })
    );
  };

  return (
    <div className="CrossExpandPanel">
      <details>
        <summary>
          <Editable text="Commentaire" />
        </summary>
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
        repo={indicateurObjectifRepository}
        indicateurUid={props.indicateur.uid}
        title="Objectifs"
        editable={true}
      />
      <AnyIndicateurLineChartExpandable
        indicateur={props.indicateur}
        indicateurId={props.indicateur.uid}
        resultatRepo={indicateurResultatRepository}
        objectifRepo={indicateurObjectifRepository}
      />
    </div>
  );
};

const IndicateurReferentielCardHeaderTitle = (props: {
  indicateur: IndicateurReferentiel;
}) => <div>{inferIndicateurReferentielAndTitle(props.indicateur)}</div>;

export const IndicateurReferentielCard = ({
  indicateur,
  hideIfNoValues = false,
}: {
  indicateur: IndicateurReferentiel;
  startOpen?: boolean;
  hideIfNoValues?: boolean;
}) => {
  const collectiviteId = useCollectiviteId()!;
  const objectifValueStorables = [];
  const resultatValueStorables = [];
  // const resultatValueStorables = useIndicateurValuesForAllYears(
  //   collectiviteId,
  //   indicateur.uid
  // );
  // const objectifValueStorables = useIndicateurValuesForAllYears(
  //   collectiviteId,
  //   indicateur.uid
  // );

  if (
    hideIfNoValues &&
    !resultatValueStorables.length &&
    !objectifValueStorables.length
  )
    return null;

  return (
    <AnyIndicateurCard
      headerTitle={
        <IndicateurReferentielCardHeaderTitle indicateur={indicateur} />
      }
      indicateurUid={indicateur.uid}
      indicateurResultatRepo={indicateurResultatRepository}
    >
      <IndicateurReferentielCardContent indicateur={indicateur} />
    </AnyIndicateurCard>
  );
};
