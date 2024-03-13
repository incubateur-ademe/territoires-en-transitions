import {ReferentielParamOption} from 'app/paths';
import {TableOptions} from 'react-table';
import {ProgressionRow} from '../data/useProgressionReferentiel';
import ProgressionReferentiel from './ProgressionReferentiel';
import {referentielToName} from 'app/labels';
import {toLocaleFixed} from 'utils/toFixed';
import {useState} from 'react';
import AccueilCard from 'app/pages/collectivite/Accueil/AccueilCard';
import Chart from 'ui/charts/Chart';
import {Button} from '@tet/ui';

type EtatDesLieuxGraphsProps = {
  referentiel: ReferentielParamOption;
  displayEtatDesLieux: boolean;
  progressionScore: Pick<
    TableOptions<ProgressionRow>,
    'data' | 'getRowId' | 'getSubRows' | 'autoResetExpanded'
  >;
  repartitionPhases: {id: string; value: number}[];
};

/**
 * Affichage des graphiques sous les cartes "état des lieux"
 */

const EtatDesLieuxGraphs = ({
  referentiel,
  displayEtatDesLieux,
  progressionScore,
  repartitionPhases,
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

  const progressionParPhaseTitre = `Répartition du score "Réalisé" par phase (${
    scoreTotal > 1 ? Math.round(scoreTotal) : toLocaleFixed(scoreTotal, 2)
  } point${Math.round(scoreTotal) <= 1 ? '' : 's'})`;

  return (
    <>
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
      <GraphCard
        title={progressionParPhaseTitre}
        subTitle={referentielToName[referentiel]}
        renderGraph={openState => (
          <Chart
            donut={{
              chart: {
                data: repartitionPhases,
                displayPercentageValue: true,
                displayOutsideLabel: true,
              },
              modalChart: {
                className: 'my-6 h-80',
              },
            }}
            infos={{
              modal: {...openState},
              title: progressionParPhaseTitre,
              subtitle: referentielToName[referentiel],
              fileName: `${referentiel}-realise-par-phase`,
            }}
          />
        )}
      />
    </>
  );
};

export default EtatDesLieuxGraphs;

type Props = {
  title: string;
  subTitle: string;
  renderGraph: (openState: {
    isOpen: boolean;
    setIsOpen: () => void;
  }) => React.ReactNode;
};

const GraphCard = ({title, subTitle, renderGraph}: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleOpen = () => setIsOpen(!isOpen);
  return (
    <AccueilCard>
      <div className="flex gap-6 mb-6">
        <div>
          <div className="mb-1 font-bold">{title}</div>
          <div className="font-medium text-grey-8">{subTitle}</div>
        </div>
        <Button
          icon="zoom-in-line"
          size="xs"
          variant="outlined"
          onClick={() => toggleOpen()}
          className="ml-auto h-fit"
        />
      </div>
      {renderGraph({isOpen, setIsOpen: toggleOpen})}
    </AccueilCard>
  );
};
