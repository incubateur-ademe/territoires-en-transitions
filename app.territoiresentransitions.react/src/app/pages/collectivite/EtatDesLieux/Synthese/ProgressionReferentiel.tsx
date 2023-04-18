import {avancementToLabel} from 'app/labels';
import {actionAvancementColors_new} from 'app/theme';
import {useEffect, useState} from 'react';
import {TableOptions} from 'react-table';
import ChartCard from 'ui/charts/ChartCard';
import FilArianeButtons from 'ui/shared/FilArianeButtons';
import {ProgressionRow} from './data/queries';
import {getFormattedScore, getIndexTitles} from './utils';

// Définition des couleurs des graphes
const customColors = {
  [`${avancementToLabel.fait}_color`]: actionAvancementColors_new.fait,
  [`${avancementToLabel.programme}_color`]:
    actionAvancementColors_new.programme,
  [`${avancementToLabel.pas_fait}_color`]: actionAvancementColors_new.pas_fait,
  [`${avancementToLabel.non_renseigne}_color`]:
    actionAvancementColors_new.non_renseigne,
};

// Définition de la légende des graphes
const legend = [
  {
    name: avancementToLabel.fait,
    color: customColors[`${avancementToLabel.fait}_color`],
  },
  {
    name: avancementToLabel.programme,
    color: customColors[`${avancementToLabel.programme}_color`],
  },
  {
    name: avancementToLabel.pas_fait,
    color: customColors[`${avancementToLabel.pas_fait}_color`],
  },
  {
    name: avancementToLabel.non_renseigne,
    color: customColors[`${avancementToLabel.non_renseigne}_color`],
  },
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
  const [scoreBreadcrumb, setScoreBreadcrumb] = useState([
    {scoreData: score.data, name: 'Vue globale'},
  ]);

  // Donnée actuellement observée dans le tableau scoreBreadcrumb
  const [indexBy, setIndexBy] = useState('');

  // Mise à jour lors du changement de valeur des scores en props
  useEffect(() => {
    setScoreBreadcrumb([{scoreData: score.data, name: 'Vue globale'}]);
    setIndexBy(score.data[0]?.type ?? '');
  }, [score.data]);

  // Affichage de l'axe enfant
  const handleOpenChildIndex = (index: string | number) => {
    const {scoreData} = scoreBreadcrumb[scoreBreadcrumb.length - 1];

    if (score.getSubRows !== undefined) {
      const relativeIndex = scoreData.findIndex(
        d => d.identifiant === index.toString()
      );
      const currentRow = scoreData[relativeIndex];

      if (currentRow) {
        const subRows = score.getSubRows(currentRow, relativeIndex);
        if (!!subRows && subRows.length > 0) {
          setScoreBreadcrumb(prevDisplayedScore => [
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
    const newScore = scoreBreadcrumb.slice(0, index + 1);
    setScoreBreadcrumb(newScore);
    setIndexBy(newScore[newScore.length - 1].scoreData[0].type);
  };

  // Props du graphe
  const chartProps = {
    data: getFormattedScore(
      scoreBreadcrumb[scoreBreadcrumb.length - 1].scoreData,
      indexBy,
      percentage,
      customColors
    ),
    indexBy: indexBy,
    indexTitles: getIndexTitles(
      scoreBreadcrumb[scoreBreadcrumb.length - 1].scoreData,
      percentage
    ),
    keys: [
      avancementToLabel.fait,
      avancementToLabel.programme,
      avancementToLabel.pas_fait,
      avancementToLabel.non_renseigne,
    ],
    layout: 'horizontal' as 'horizontal' | 'vertical',
    inverted: true,
    customColors: true,
    unit: percentage ? '%' : 'points',
    onSelectIndex: handleOpenChildIndex,
  };

  const title = `Progression ${!!indexBy ? `par ${indexBy}` : ''} en valeur ${
    percentage ? 'relative' : 'absolue'
  }`;

  const fileName = `${referentiel}-${
    indexBy === 'axe'
      ? 'référentiel'
      : `axe${scoreBreadcrumb[scoreBreadcrumb.length - 1].name
          .split('.')
          .join('-')}`
  }-${percentage ? 'pourcentage' : 'points'}`;

  return (
    <ChartCard
      chartType="bar"
      chartProps={chartProps}
      chartInfo={{
        title,
        legend,
        expandable: true,
        downloadedFileName: fileName,
        additionalInfo: getIndexTitles(
          scoreBreadcrumb[scoreBreadcrumb.length - 1].scoreData,
          false
        ),
      }}
      topElement={
        scoreBreadcrumb.length > 1 ? (
          <FilArianeButtons
            displayedNames={scoreBreadcrumb.map(
              currentScore => currentScore.name
            )}
            handleClick={handleOpenParentIndex}
          />
        ) : undefined
      }
    />
  );
};

export default ProgressionReferentiel;
