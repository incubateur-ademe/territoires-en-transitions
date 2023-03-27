import {TableOptions} from 'react-table';
import BarChart from 'ui/charts/BarChart';
import {ActionStatusColor} from 'ui/charts/chartsTheme';
import ChartWrapper from 'ui/charts/ChartWrapper';
import {ProgressionRow} from './data/queries';

const getAverageScore = (
  data: readonly ProgressionRow[],
  key: string
): number => {
  return (
    // @ts-ignore
    (data.reduce((res, currVal) => res + currVal[key], 0) /
      (data.length || 1)) *
    100
  );
};

type ProgressionReferentielProps = {
  score: Pick<
    TableOptions<ProgressionRow>,
    'data' | 'getRowId' | 'getSubRows' | 'autoResetExpanded'
  >;
  percentage?: boolean;
  title?: string;
};

const ProgressionReferentiel = ({
  score,
  percentage = false,
  title,
}: ProgressionReferentielProps): JSX.Element => {
  const formattedScore = [];
  let indexTitles = [];

  // Définition des titres des axes
  indexTitles = score.data.map(d => `${d.action_id.split('_')[1]}. ${d.nom}`);

  // Définition des couleurs
  const colors = {
    Fait_color: ActionStatusColor.Fait,
    Programmé_color: ActionStatusColor.Programmé,
    'Pas fait_color': ActionStatusColor['Pas fait'],
    'Non renseigné_color': ActionStatusColor['Non renseigné'],
  };

  if (percentage) {
    // Formate les scores (%) pour un affichage sur 100
    formattedScore.push(
      ...score.data.map(d => ({
        Axe: `${d.action_id.split('_')[1]}`,
        Fait: d.score_realise * 100,
        Programmé: d.score_programme * 100,
        'Pas fait': d.score_pas_fait * 100,
        'Non renseigné': d.score_non_renseigne * 100,
        ...colors,
      }))
    );

    // Calcul des scores totaux
    formattedScore.push({
      Axe: 'Total',
      Fait: getAverageScore(score.data, 'score_realise'),
      Programmé: getAverageScore(score.data, 'score_programme'),
      'Pas fait': getAverageScore(score.data, 'score_pas_fait'),
      'Non renseigné': getAverageScore(score.data, 'score_non_renseigne'),
      ...colors,
    });

    // Ajout de "Total" dans les titres index
    indexTitles.push('Total');
  } else {
    // Formate les scores en points
    formattedScore.push(
      ...score.data.map(d => ({
        Axe: `${d.action_id.split('_')[1]}`,
        Fait: d.points_realises,
        Programmé: d.points_programmes,
        'Pas fait': d.score_pas_fait * d.points_max_referentiel,
        'Non renseigné':
          d.points_max_referentiel -
          d.points_realises -
          d.points_programmes -
          d.score_pas_fait * d.points_max_referentiel,
        ...colors,
      }))
    );
  }

  return (
    <ChartWrapper title={title}>
      <BarChart
        data={formattedScore}
        indexBy="Axe"
        indexTitles={indexTitles}
        keys={['Fait', 'Programmé', 'Pas fait', 'Non renseigné']}
        layout="horizontal"
        inverted
        customColors
        unit={percentage ? '%' : 'points'}
      />
    </ChartWrapper>
  );
};

export default ProgressionReferentiel;
