import {ReferentielParamOption} from 'app/paths';
import classNames from 'classnames';
import {TableOptions} from 'react-table';
import {ProgressionRow} from '../EtatDesLieux/Synthese/data/useProgressionReferentiel';
import ProgressionReferentiel from '../EtatDesLieux/Synthese/ProgressionReferentiel';
import {defaultColors} from 'ui/charts/chartsTheme';
import {referentielToName} from 'app/labels';
import {toLocaleFixed} from 'utils/toFixed';
import ChartCard from 'ui/charts/ChartCard';

type EtatDesLieuxGraphsProps = {
  referentiel: ReferentielParamOption;
  displayEtatDesLieux: boolean;
  progressionScore: Pick<
    TableOptions<ProgressionRow>,
    'data' | 'getRowId' | 'getSubRows' | 'autoResetExpanded'
  >;
  repartitionPhases: {id: string; value: number}[];
  className?: string;
};

/**
 * Affichage des graphiques sous les cartes "état des lieux"
 */

const EtatDesLieuxGraphs = ({
  referentiel,
  displayEtatDesLieux,
  progressionScore,
  repartitionPhases,
  className,
}: EtatDesLieuxGraphsProps): JSX.Element => {
  const graphStyles = {
    boxShadow: '0px 2px 16px 0px #0063CB0A, 0px 4px 6px 0px #0063CB0F',
    border: 'none',
    borderRadius: '8px',
    height: '415px',
  };

  const scoreTotal =
    Math.round(
      repartitionPhases.reduce(
        (total, currValue) => (total += currValue.value),
        0
      ) * 10
    ) / 10;

  return displayEtatDesLieux ? (
    <div className={classNames('grid grid-cols-1 gap-6', className)}>
      <ProgressionReferentiel
        score={progressionScore}
        referentiel={referentiel}
        customStyle={graphStyles}
      />
      <ProgressionReferentiel
        score={progressionScore}
        referentiel={referentiel}
        percentage
        customStyle={graphStyles}
      />
      {/** Progression par phase */}
      <ChartCard
        chartType="donut"
        chartProps={{
          data: repartitionPhases,
          label: true,
          displayPercentageValue: true,
        }}
        chartInfo={{
          title: `Répartition du score "Réalisé" par phase (${
            scoreTotal > 1
              ? Math.round(scoreTotal)
              : toLocaleFixed(scoreTotal, 2)
          } point${Math.round(scoreTotal) <= 1 ? '' : 's'})`,
          subtitle: referentielToName[referentiel],
          legend: repartitionPhases.map((el, index) => ({
            name: el.id,
            color: defaultColors[index % defaultColors.length],
          })),
          expandable: true,
          downloadedFileName: `${referentiel}-realise-par-phase`,
        }}
        customStyle={graphStyles}
      />
    </div>
  ) : (
    <div className={className}></div>
  );
};

export default EtatDesLieuxGraphs;
