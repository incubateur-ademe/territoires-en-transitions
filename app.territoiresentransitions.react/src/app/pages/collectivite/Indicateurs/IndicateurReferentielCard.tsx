import React, {useEffect} from 'react';
import {AnyIndicateurValues} from 'app/pages/collectivite/Indicateurs/AnyIndicateurValues';

import {useCollectiviteId} from 'core-logic/hooks/params';
import {AnyIndicateurLineChartExpandable} from './AnyIndicateurLineChartExpandable';
import {inferIndicateurTitle} from 'utils/indicateurs';
import {AnyIndicateurCard} from 'app/pages/collectivite/Indicateurs/AnyIndicateurCard';
import {Spacer} from 'ui/shared/Spacer';
import {
  indicateurObjectifRepository,
  indicateurResultatRepository,
} from 'core-logic/api/repositories/AnyIndicateurRepository';
import {indicateurCommentaireRepository} from 'core-logic/api/repositories/IndicateurCommentaireRepository';
import {useAnyIndicateurValuesForAllYears} from 'core-logic/hooks/indicateur_values';
import {IndicateurDefinitionRead} from 'generated/dataLayer/indicateur_definition_read';
import {AnyIndicateurCommentaire} from 'app/pages/collectivite/Indicateurs/AnyIndicateurCommentaire';

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

  return <AnyIndicateurCommentaire handleSave={handleSave} value={value} />;
};

export const IndicateurReferentielCardContent = (props: {
  definition: IndicateurDefinitionRead;
}) => {
  return (
    <div>
      <div className="text-lg ml-7 mb-2">Objectifs</div>
      <AnyIndicateurValues
        repo={indicateurObjectifRepository}
        indicateurId={props.definition.id}
        borderColor="blue"
      />
      <Spacer />
      <Commentaire definition={props.definition} />
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
}) => <div>{inferIndicateurTitle(props.definition)}</div>;

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
      description={definition.description}
    >
      <IndicateurReferentielCardContent definition={definition} />
    </AnyIndicateurCard>
  );
};
