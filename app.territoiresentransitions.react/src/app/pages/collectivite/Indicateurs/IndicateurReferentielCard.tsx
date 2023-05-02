import React, {useEffect} from 'react';
import {AnyIndicateurValues} from 'app/pages/collectivite/Indicateurs/AnyIndicateurValues';

import {useCollectiviteId} from 'core-logic/hooks/params';
import {AnyIndicateurLineChartExpandable} from './AnyIndicateurLineChartExpandable';
import {AnyIndicateurCard} from 'app/pages/collectivite/Indicateurs/AnyIndicateurCard';
import {Spacer} from 'ui/dividers/Spacer';
import {
  indicateurObjectifRepository,
  indicateurResultatRepository,
} from 'core-logic/api/repositories/AnyIndicateurRepository';
import {indicateurCommentaireRepository} from 'core-logic/api/repositories/IndicateurCommentaireRepository';
import {useAnyIndicateurValuesForAllYears} from 'core-logic/hooks/indicateur_values';
import {TIndicateurDefinition} from 'app/pages/collectivite/Indicateurs/useAllIndicateurDefinitions';
import {AnyIndicateurCommentaire} from 'app/pages/collectivite/Indicateurs/AnyIndicateurCommentaire';
import {ReferentielOfIndicateur} from 'types/litterals';

const Commentaire = (props: {definition: TIndicateurDefinition}) => {
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
  definition: TIndicateurDefinition;
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
  definition: TIndicateurDefinition;
}) => <div>{inferIndicateurTitle(props.definition)}</div>;

export const IndicateurReferentielCard = ({
  definition,
  hideIfNoValues = false,
}: {
  definition: TIndicateurDefinition;
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

// formate l'identifiant et le nom d'un indicateur
export const inferIndicateurTitle = (
  definition: TIndicateurDefinition,
  withReferentielPrefix = false
) => {
  const indicateurId = definition.id;
  const id_groups = indicateurId.match(indicateurIdRegexp)?.groups;
  if (!id_groups) return indicateurId;
  const ref = id_groups['ref'] as ReferentielOfIndicateur;
  return `${withReferentielPrefix ? ref.toUpperCase() + ' ' : ''}${
    definition.identifiant
  } - ${definition.nom}`;
};

const indicateurIdRegexp =
  '(?<ref>eci|cae|crte)_(?<number>[0-9]{1,3})(?<literal>.+)?';
