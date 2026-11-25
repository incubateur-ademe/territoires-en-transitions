import { useIndicateurChart } from '../../context/indicateur-chart.context';
import { useIndicateurData } from '../../context/indicateur-data.context';
import {
  INDICATEUR_PERSONNALISATION_IDENTIFIANT,
  IndicateurPersonnalisationQuestions,
} from './indicateur-personnalisation.questions';

export const IndicateurPersonnalisationSection = () => {
  const { indicateur, canMutateIndicateur } = useIndicateurData();
  const { chartInfo } = useIndicateurChart();

  if (
    indicateur.identifiantReferentiel !==
    INDICATEUR_PERSONNALISATION_IDENTIFIANT
  ) {
    return null;
  }

  return (
    <IndicateurPersonnalisationQuestions
      isDrom={chartInfo.sourceFilter.valeursReference?.drom ?? false}
      canEdit={canMutateIndicateur}
    />
  );
};
