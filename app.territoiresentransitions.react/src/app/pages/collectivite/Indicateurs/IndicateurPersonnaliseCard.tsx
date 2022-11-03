import {AnyIndicateurCard} from 'app/pages/collectivite/Indicateurs/AnyIndicateurCard';
import {AnyIndicateurCommentaire} from 'app/pages/collectivite/Indicateurs/AnyIndicateurCommentaire';
import {AnyIndicateurLineChartExpandable} from 'app/pages/collectivite/Indicateurs/AnyIndicateurLineChartExpandable';
import {AnyIndicateurValues} from 'app/pages/collectivite/Indicateurs/AnyIndicateurValues';
import {IndicateurPersonnaliseEditionDialog} from 'app/pages/collectivite/Indicateurs/IndicateurPersonnaliseEditionDialog';
import {
  indicateurPersonnaliseObjectifRepository,
  indicateurPersonnaliseResultatRepository,
} from 'core-logic/api/repositories/AnyIndicateurRepository';
import {indicateurPersonnaliseDefinitionRepository} from 'core-logic/api/repositories/IndicateurPersonnaliseDefinitionRepository';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {useAnyIndicateurValuesForAllYears} from 'core-logic/hooks/indicateur_values';
import {IndicateurPersonnaliseDefinitionRead} from 'generated/dataLayer/indicateur_personnalise_definition_read';
import React from 'react';
import {Spacer} from 'ui/shared/Spacer';

const Commentaire = (props: {
  indicateur: IndicateurPersonnaliseDefinitionRead;
}) => {
  const [value, setValue] = React.useState(props.indicateur.commentaire);
  const [initialValue, setInitialValue] = React.useState(
    props.indicateur.commentaire
  );
  if (props.indicateur.commentaire !== initialValue) {
    // We use an initial value to update the field value on indicateur change.
    setValue(props.indicateur.commentaire);
    setInitialValue(props.indicateur.commentaire);
  }

  const handleSave = (event: React.FormEvent<HTMLTextAreaElement>) => {
    const inputValue = event.currentTarget.value;
    const data = {
      ...props.indicateur,
    };
    data['commentaire'] = inputValue;
    indicateurPersonnaliseDefinitionRepository.save(data);
  };

  return <AnyIndicateurCommentaire handleSave={handleSave} value={value} />;
};

const IndicateurPersonnaliseCardContent = (props: {
  indicateur: IndicateurPersonnaliseDefinitionRead;
}) => {
  return (
    <div>
      <div className="text-lg ml-7 mb-2">Objectifs</div>
      <AnyIndicateurValues
        repo={indicateurPersonnaliseObjectifRepository}
        indicateurId={props.indicateur.id}
        borderColor="blue"
      />
      <Spacer />
      <Commentaire indicateur={props.indicateur} />

      <AnyIndicateurLineChartExpandable<number>
        title={props.indicateur.titre}
        unite={props.indicateur.unite}
        indicateurId={props.indicateur.id}
        resultatRepo={indicateurPersonnaliseResultatRepository}
        objectifRepo={indicateurPersonnaliseObjectifRepository}
      />
    </div>
  );
};

const IndicateurPersonnaliseHeaderTitle = (props: {
  indicateur: IndicateurPersonnaliseDefinitionRead;
}) => (
  <div className="flex justify-between w-full">
    <div>{props.indicateur.titre}</div>
    <div className="mr-4">
      <IndicateurPersonnaliseEditionDialog indicateur={props.indicateur} />
    </div>
  </div>
);

export const IndicateurPersonnaliseCard = ({
  indicateur,
  hideIfNoValues = false,
}: {
  indicateur: IndicateurPersonnaliseDefinitionRead;
  hideIfNoValues?: boolean;
}) => {
  const collectiviteId = useCollectiviteId()!;
  const resultatValues = useAnyIndicateurValuesForAllYears({
    collectiviteId,
    indicateurId: indicateur.id,
    repo: indicateurPersonnaliseResultatRepository,
  });
  const objectifValues = useAnyIndicateurValuesForAllYears({
    collectiviteId,
    indicateurId: indicateur.id,
    repo: indicateurPersonnaliseObjectifRepository,
  });

  if (hideIfNoValues && !resultatValues.length && !objectifValues.length)
    return null;
  return (
    <AnyIndicateurCard
      headerTitle={
        <IndicateurPersonnaliseHeaderTitle indicateur={indicateur} />
      }
      indicateurId={indicateur.id}
      indicateurResultatRepo={indicateurPersonnaliseResultatRepository}
      description={indicateur.description}
    >
      <IndicateurPersonnaliseCardContent indicateur={indicateur} />
    </AnyIndicateurCard>
  );
};
