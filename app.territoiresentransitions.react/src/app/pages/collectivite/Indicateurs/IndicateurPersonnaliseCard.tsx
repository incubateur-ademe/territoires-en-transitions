import {AnyIndicateurCard} from 'app/pages/collectivite/Indicateurs/AnyIndicateurCard';
import {AnyIndicateurCommentaire} from 'app/pages/collectivite/Indicateurs/AnyIndicateurCommentaire';
import {AnyIndicateurLineChartExpandable} from 'app/pages/collectivite/Indicateurs/AnyIndicateurLineChartExpandable';
import {AnyIndicateurValues} from 'app/pages/collectivite/Indicateurs/AnyIndicateurValues';
import {IndicateurPersonnaliseEditionDialog} from 'app/pages/collectivite/Indicateurs/IndicateurPersonnaliseEditionDialog';
import {
  indicateurPersonnaliseObjectifRepository,
  indicateurPersonnaliseResultatRepository,
} from 'core-logic/api/repositories/AnyIndicateurRepository';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {useAnyIndicateurValuesForAllYears} from 'core-logic/hooks/indicateur_values';
import React from 'react';
import {Spacer} from 'ui/dividers/Spacer';
import {TIndicateurPersoDefinition} from './useIndicateursPersoDefinitions';
import {useUpsertIndicateurPersoDefinition} from './useUpsertIndicateurPersoDefinition';

const Commentaire = (props: {indicateur: TIndicateurPersoDefinition}) => {
  const {indicateur} = props;
  const {mutate: save} = useUpsertIndicateurPersoDefinition();
  const [value, setValue] = React.useState(indicateur.commentaire);
  const [initialValue, setInitialValue] = React.useState(
    indicateur.commentaire
  );
  if (indicateur.commentaire !== initialValue) {
    // We use an initial value to update the field value on indicateur change.
    setValue(indicateur.commentaire);
    setInitialValue(indicateur.commentaire);
  }

  const handleSave = (event: React.FormEvent<HTMLTextAreaElement>) => {
    const inputValue = event.currentTarget.value;
    save({
      ...indicateur,
      commentaire: inputValue,
    });
  };

  return <AnyIndicateurCommentaire handleSave={handleSave} value={value} />;
};

const IndicateurPersonnaliseCardContent = (props: {
  indicateur: TIndicateurPersoDefinition;
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
  indicateur: TIndicateurPersoDefinition;
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
  indicateur: TIndicateurPersoDefinition;
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
