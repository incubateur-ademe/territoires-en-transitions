import { avancementToLabel, referentielToName } from '@/app/app/labels';
import { actionAvancementColors } from '@/app/app/theme';
import BarChartCardWithSubrows, {
  TBarChartScoreTable,
} from '@/app/ui/charts/old/BarChartCardWithSubrows';
import { ReferentielId } from '@tet/domain/referentiels';
import { TableOptions } from 'react-table';
import { ProgressionRow } from '../../DEPRECATED_scores.types';
import { getFormattedScore } from '../utils';

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
  referentiel: ReferentielId;
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
