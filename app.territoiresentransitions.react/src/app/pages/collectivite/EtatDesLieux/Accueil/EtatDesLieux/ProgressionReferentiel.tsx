import {avancementToLabel, referentielToName} from 'app/labels';
import {ReferentielParamOption} from 'app/paths';
import {actionAvancementColors} from 'app/theme';
import {TableOptions} from 'react-table';
import BarChartCardWithSubrows from 'ui/charts/old/BarChartCardWithSubrows';
import {ProgressionRow} from '../data/useProgressionReferentiel';
import {getFormattedScore} from './utils';
import {TBarChartScoreTable} from 'ui/charts/old/BarChartCardWithSubrows';

// Définition des couleurs des graphes
const customColors = {
  [`${avancementToLabel.fait}_color`]: actionAvancementColors.fait,
  [`${avancementToLabel.programme}_color`]: actionAvancementColors.programme,
  [`${avancementToLabel.pas_fait}_color`]: actionAvancementColors.pas_fait,
  [`${avancementToLabel.non_renseigne}_color`]:
    actionAvancementColors.non_renseigne,
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
  referentiel: ReferentielParamOption;
  percentage?: boolean;
  customStyle?: React.CSSProperties;
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
  customStyle,
}: ProgressionReferentielProps): JSX.Element => {
  return (
    <BarChartCardWithSubrows
      referentiel={referentiel}
      percentage={percentage}
      score={score as TBarChartScoreTable}
      chartProps={{
        keys: [
          avancementToLabel.fait,
          avancementToLabel.programme,
          avancementToLabel.pas_fait,
          avancementToLabel.non_renseigne,
        ],
        layout: 'horizontal',
        inverted: true,
        customColors,
      }}
      chartInfo={{
        title: 'Progression',
        subtitle: referentielToName[referentiel],
        legend,
        expandable: true,
        downloadable: true,
        additionalInfo: true,
      }}
      getFormattedScore={(scoreData, indexBy, percentage, customColors) =>
        getFormattedScore(
          scoreData as readonly ProgressionRow[],
          indexBy,
          percentage,
          customColors
        )
      }
      customStyle={customStyle}
    />
  );
};

export default ProgressionReferentiel;
