import {useEffect, useState} from 'react';
import {TableOptions} from 'react-table';
import BarChart from 'ui/charts/BarChart';
import {ActionStatusColor} from 'ui/charts/chartsTheme';
import ChartWrapper from 'ui/charts/ChartWrapper';
import {ProgressionRow} from './data/queries';

// Définition des couleurs des graphes
const customColors = {
  Fait_color: ActionStatusColor.Fait,
  Programmé_color: ActionStatusColor.Programmé,
  'Pas fait_color': ActionStatusColor['Pas fait'],
  'Non renseigné_color': ActionStatusColor['Non renseigné'],
};

/**
 * Affichage des scores et navigation parmi les axes
 *
 * @param score
 * @param percentage
 */

type ProgressionReferentielProps = {
  score: Pick<
    TableOptions<ProgressionRow>,
    'data' | 'getRowId' | 'getSubRows' | 'autoResetExpanded'
  >;
  percentage?: boolean;
};

const ProgressionReferentiel = ({
  score,
  percentage = false,
}: ProgressionReferentielProps): JSX.Element => {
  // Associe la data des scores à un nom d'affichage pour le breadcrumb
  const [displayedScore, setDisplayedScore] = useState<
    {scoreData: readonly ProgressionRow[]; name: string}[]
  >([{scoreData: score.data, name: 'Vue globale'}]);

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

  return (
    <ChartWrapper
      title={`Progression ${!!indexBy ? `par ${indexBy}` : ''} en valeur ${
        percentage ? 'relative' : 'absolue'
      }`}
      customStyle={{position: 'relative'}}
    >
      {displayedScore.length > 1 && (
        <div className="flex items-center flex-wrap gap-y-0.5 pr-6 text-xs text-gray-500 absolute left-6 top-14 z-10">
          {displayedScore.map((dispScore, index) => (
            <div key={dispScore.name} className="flex items-center shrink-0">
              <button
                disabled={index === displayedScore.length - 1}
                style={{
                  cursor:
                    index === displayedScore.length - 1 ? 'default' : 'pointer',
                }}
                onClick={() => handleOpenParentIndex(index)}
              >
                <span
                  className={
                    index + 1 < displayedScore.length ? 'underline' : ''
                  }
                >
                  {dispScore.name}
                </span>
              </button>
              {index + 1 < displayedScore.length && (
                <div className="fr-fi-arrow-down-s-line scale-75 shrink-0 -rotate-90" />
              )}
            </div>
          ))}
        </div>
      )}

      <BarChart
        data={getFormattedScore()}
        indexBy={indexBy}
        indexTitles={getIndexTitles()}
        keys={['Fait', 'Programmé', 'Pas fait', 'Non renseigné']}
        layout="horizontal"
        inverted
        customColors
        unit={percentage ? '%' : 'points'}
        onSelectIndex={handleOpenChildIndex}
      />
    </ChartWrapper>
  );
};

export default ProgressionReferentiel;
