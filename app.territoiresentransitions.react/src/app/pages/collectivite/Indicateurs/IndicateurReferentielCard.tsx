import React, {useEffect} from 'react';
import {IndicateurReferentiel} from 'generated/models/indicateur_referentiel';
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
import {indicateurCommentaireRepository} from 'core-logic/api/repositories/IndicateurCommentaireRepository';
import {useAnyIndicateurValuesForAllYears} from 'core-logic/hooks/indicateur_values';

const Commentaire = (props: {indicateur: IndicateurReferentiel}) => {
  const indicateurId = props.indicateur.id;
  const [value, setValue] = React.useState('');
  const collectiviteId = useCollectiviteId()!;

  useEffect(() => {
    indicateurCommentaireRepository
      .fetchCommentaireForId({
        collectiviteId,
        indicateurId,
      })
      .then(commentaireRead => setValue(commentaireRead?.commentaire ?? ''));
  }, [value, collectiviteId]);

  const handleSave = (event: React.FormEvent<HTMLTextAreaElement>) => {
    const inputValue = event.currentTarget.value;
    indicateurCommentaireRepository.save({
      collectivite_id: collectiviteId,
      indicateur_id: indicateurId,
      commentaire: inputValue,
    });
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
        indicateurId={props.indicateur.uid}
        title="Objectifs"
        editable={true}
      />
      <AnyIndicateurLineChartExpandable<string>
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

  const resultatValues = useAnyIndicateurValuesForAllYears({
    collectiviteId,
    indicateurId: indicateur.id,
    repo: indicateurResultatRepository,
  });
  const objectifValues = useAnyIndicateurValuesForAllYears({
    collectiviteId,
    indicateurId: indicateur.id,
    repo: indicateurObjectifRepository,
  });

  if (hideIfNoValues && !resultatValues.length && !objectifValues.length)
    return null;

  return (
    <AnyIndicateurCard
      headerTitle={
        <IndicateurReferentielCardHeaderTitle indicateur={indicateur} />
      }
      indicateurId={indicateur.uid}
      indicateurResultatRepo={indicateurResultatRepository}
    >
      <IndicateurReferentielCardContent indicateur={indicateur} />
    </AnyIndicateurCard>
  );
};
