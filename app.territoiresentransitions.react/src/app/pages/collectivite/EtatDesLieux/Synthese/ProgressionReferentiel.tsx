import {useEffect, useState} from 'react';
import {TableOptions} from 'react-table';
import {ActionStatusColor} from 'ui/charts/chartsTheme';
import ChartCard from 'ui/charts/ChartCard';
import FilArianeButtons from 'ui/shared/FilArianeButtons';
import {ProgressionRow} from './data/queries';

// Définition des couleurs des graphes
const customColors = {
  Fait_color: ActionStatusColor.Fait,
  Programmé_color: ActionStatusColor.Programmé,
  'Pas fait_color': ActionStatusColor['Pas fait'],
  'Non renseigné_color': ActionStatusColor['Non renseigné'],
};

const legend = [
  {name: 'Fait', color: customColors.Fait_color},
  {name: 'Programmé', color: customColors.Programmé_color},
  {name: 'Pas fait', color: customColors['Pas fait_color']},
  {name: 'Non renseigné', color: customColors['Non renseigné_color']},
];

type ProgressionReferentielProps = {
  score: Pick<
    TableOptions<ProgressionRow>,
    'data' | 'getRowId' | 'getSubRows' | 'autoResetExpanded'
  >;
  referentiel: string;
  percentage?: boolean;
};

/**
 * Affichage des scores et navigation parmi les axes
 *
 * @param score
 * @param referentiel
 * @param percentage
 */

const ProgressionReferentiel = ({
  score,
  referentiel,
  percentage = false,
}: ProgressionReferentielProps): JSX.Element => {
  // Associe la data des scores à un nom d'affichage pour le breadcrumb
  const [displayedScore, setDisplayedScore] = useState<
    {scoreData: readonly ProgressionRow[]; name: string}[]
  >([{scoreData: score.data, name: 'Vue globale'}]);

  // Donnée observée
  const [indexBy, setIndexBy] = useState<string>('');

  // Mise à jour lors du changement de valeur des scores en props
  useEffect(() => {
    setDisplayedScore([{scoreData: score.data, name: 'Vue globale'}]);
    setIndexBy(score.data[0]?.type ?? '');
  }, [score.data]);

  // Calcul des scores moyens en % pour la ligne "Total"
  const getAverageScore = (key: string): number => {
    const {scoreData} = displayedScore[displayedScore.length - 1];
    return (
      // @ts-ignore
      (scoreData.reduce((res, currVal) => res + currVal[key], 0) /
        (scoreData.length || 1)) *
      100
    );
  };

  // Mise en forme des scores pour les graphes
  const getFormattedScore = () => {
    const {scoreData} = displayedScore[displayedScore.length - 1];
    const formattedScore = [];

    if (percentage) {
      // Formate les scores (%) pour un affichage sur 100
      formattedScore.push(
        ...scoreData.map(d => ({
          [indexBy]: `${d.action_id.split('_')[1]}`,
          Fait: d.score_realise * 100,
          Programmé: d.score_programme * 100,
          'Pas fait': d.score_pas_fait * 100,
          'Non renseigné': d.score_non_renseigne * 100,
          ...customColors,
        }))
      );

      // Calcul des scores totaux
      formattedScore.push({
        [indexBy]: 'Total',
        Fait: getAverageScore('score_realise'),
        Programmé: getAverageScore('score_programme'),
        'Pas fait': getAverageScore('score_pas_fait'),
        'Non renseigné': getAverageScore('score_non_renseigne'),
        ...customColors,
      });
    } else {
      // Formate les scores en points
      formattedScore.push(
        ...scoreData.map(d => ({
          [indexBy]: `${d.action_id.split('_')[1]}`,
          Fait: d.points_realises,
          Programmé: d.points_programmes,
          'Pas fait': d.score_pas_fait * d.points_max_personnalises,
          'Non renseigné':
            d.points_max_personnalises -
            d.points_realises -
            d.points_programmes -
            d.score_pas_fait * d.points_max_personnalises,
          ...customColors,
        }))
      );
    }

    return formattedScore;
  };

  // Définition des titres des axes pour les graphes
  const getIndexTitles = () => {
    let indexTitles = displayedScore[displayedScore.length - 1].scoreData.map(
      d => `${d.action_id.split('_')[1]}. ${d.nom}`
    );
    if (percentage) indexTitles.push('Total');

    return indexTitles;
  };

  // Affichage de l'axe enfant
  const handleOpenChildIndex = (index: string | number) => {
    const {scoreData} = displayedScore[displayedScore.length - 1];

    if (score.getSubRows !== undefined) {
      const relativeIndex = scoreData.findIndex(
        d => d.identifiant === index.toString()
      );
      const currentRow = scoreData[relativeIndex];

      if (currentRow) {
        const subRows = score.getSubRows(currentRow, relativeIndex);
        if (!!subRows && subRows.length > 0) {
          setDisplayedScore(prevDisplayedScore => [
            ...prevDisplayedScore,
            {scoreData: subRows, name: index.toString()},
          ]);
          setIndexBy(subRows[0].type);
        }
      }
    }
  };

  // Affichage d'un axe parent
  const handleOpenParentIndex = (index: number) => {
    const newScore = displayedScore.slice(0, index + 1);
    setDisplayedScore(newScore);
    setIndexBy(newScore[newScore.length - 1].scoreData[0].type);
  };

  // Props du graphe
  const chartProps = {
    data: getFormattedScore(),
    indexBy: indexBy,
    indexTitles: getIndexTitles(),
    keys: ['Fait', 'Programmé', 'Pas fait', 'Non renseigné'],
    layout: 'horizontal' as 'horizontal' | 'vertical',
    inverted: true,
    customColors: true,
    unit: percentage ? '%' : 'points',
    onSelectIndex: handleOpenChildIndex,
  };

  const title = `Progression ${!!indexBy ? `par ${indexBy}` : ''} en valeur ${
    percentage ? 'relative' : 'absolue'
  }`;
  const fileName = `${referentiel}-${indexBy}-valeur-${
    percentage ? 'relative' : 'absolue'
  }`;

  return (
    <ChartCard
      chartType="bar"
      chartProps={chartProps}
      chartInfo={{
        title,
        legend,
        expandable: true,
        downloadedFileName: fileName,
        additionalInfo: getIndexTitles().filter(title => title !== 'Total'),
      }}
      topElement={
        displayedScore.length > 1 ? (
          <FilArianeButtons
            displayedNames={displayedScore.map(dispScore => dispScore.name)}
            handleClick={handleOpenParentIndex}
          />
        ) : undefined
      }
    />
  );
};

export default ProgressionReferentiel;
