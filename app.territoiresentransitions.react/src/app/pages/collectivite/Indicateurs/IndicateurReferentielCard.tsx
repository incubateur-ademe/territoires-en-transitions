import React, {useEffect} from 'react';
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
import {IndicateurDefinitionRead} from 'generated/dataLayer/indicateur_definition_read';

const Commentaire = (props: {definition: IndicateurDefinitionRead}) => {
  const indicateurId = props.definition.id;
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
  definition: IndicateurDefinitionRead;
}) => {
  return (
    <div>
      <IndicateurDescriptionPanel description={props.definition.description} />
      <Commentaire definition={props.definition} />
      <AnyIndicateurEditableExpandPanel
        repo={indicateurObjectifRepository}
        indicateurId={props.definition.id}
        title="Objectifs"
        editable={true}
      />
      <AnyIndicateurLineChartExpandable
        title={props.definition.nom}
        unite={props.definition.unite}
        indicateurId={props.definition.id}
        resultatRepo={indicateurResultatRepository}
        objectifRepo={indicateurObjectifRepository}
      />
    </div>
  );
};

const IndicateurReferentielCardHeaderTitle = (props: {
  definition: IndicateurDefinitionRead;
}) => <div>{inferIndicateurReferentielAndTitle(props.definition)}</div>;

export const IndicateurReferentielCard = ({
  definition,
  hideIfNoValues = false,
}: {
  definition: IndicateurDefinitionRead;
  startOpen?: boolean;
  hideIfNoValues?: boolean;
}) => {
  const collectiviteId = useCollectiviteId()!;

  const resultatValues = useAnyIndicateurValuesForAllYears({
    collectiviteId,
    indicateurId: definition.id,
    repo: indicateurResultatRepository,
  });
  const objectifValues = useAnyIndicateurValuesForAllYears({
    collectiviteId,
    indicateurId: definition.id,
    repo: indicateurObjectifRepository,
  });

  if (hideIfNoValues && !resultatValues.length && !objectifValues.length)
    return null;

  return (
    <AnyIndicateurCard
      headerTitle={
        <IndicateurReferentielCardHeaderTitle definition={definition} />
      }
      indicateurId={definition.id}
      indicateurResultatRepo={indicateurResultatRepository}
    >
      <IndicateurReferentielCardContent definition={definition} />
    </AnyIndicateurCard>
  );
};
