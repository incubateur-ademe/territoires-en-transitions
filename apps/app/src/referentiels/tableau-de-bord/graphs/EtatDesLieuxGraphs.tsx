import { useCurrentCollectivite } from '@/api/collectivites';
import { referentielToName } from '@/app/app/labels';
import { makeReferentielUrl } from '@/app/app/paths';
import Chart from '@/app/ui/charts/Chart';
import { toLocaleFixed } from '@/app/utils/to-locale-fixed';
import { ReferentielId } from '@/domain/referentiels';
import { Button, Event, useEventTracker } from '@/ui';
import { useState } from 'react';
import { TableOptions } from 'react-table';
import { ProgressionRow } from '../../DEPRECATED_scores.types';
import { AccueilCard } from '../AccueilCard';
import ProgressionReferentiel from './ProgressionReferentiel';
import { TdbScoreTotalChart } from './tdb-score-total.chart';

type EtatDesLieuxGraphsProps = {
  referentiel: ReferentielId;
  displayEtatDesLieux: boolean;
  progressionScore: Pick<
    TableOptions<ProgressionRow>,
    'data' | 'getRowId' | 'getSubRows' | 'autoResetExpanded'
  >;
  repartitionPhases: { id: string; value: number }[];
};

/**
 * Affichage des graphiques sous les cartes "état des lieux"
 */

export const EtatDesLieuxGraphs = ({
  referentiel,
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

  const trackEvent = useEventTracker();

  const { collectiviteId } = useCurrentCollectivite();

  return (
    <>
      <TdbScoreTotalChart
        title="L'évolution du score en points"
        subTitle={referentielToName[referentiel]}
        referentielId={referentiel}
        href={makeReferentielUrl({
          collectiviteId,
          referentielId: referentiel,
          referentielTab: 'evolutions',
        })}
      />
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
        onOpenModal={() =>
          trackEvent(Event.viewGraphZoom, {
            referentiel,
            type: 'phase',
          })
        }
        renderGraph={(openState) => (
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
              modal: { ...openState },
              title: progressionParPhaseTitre,
              subtitle: referentielToName[referentiel],
              fileName: `${referentiel}-realise-par-phase`,
            }}
            onDownload={() =>
              trackEvent(Event.downloadGraph, {
                referentiel,
                type: 'phase',
              })
            }
          />
        )}
      />
    </>
  );
};

type GraphCardProps = {
  title: string;
  subTitle: string;
  renderGraph: (openState: {
    isOpen: boolean;
    setIsOpen: () => void;
  }) => React.ReactNode;
  onOpenModal?: () => void;
  href?: string;
};

export const GraphCard = ({
  title,
  subTitle,
  renderGraph,
  onOpenModal,
  href,
}: GraphCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleOpen = () => setIsOpen(!isOpen);

  const handleZoom = () => {
    toggleOpen();
    onOpenModal?.();
  };

  return (
    <AccueilCard>
      <div className="flex gap-6 mb-6">
        <div>
          <div className="mb-1 font-bold">{title}</div>
          <div className="font-medium text-grey-8">{subTitle}</div>
        </div>
        {href ? (
          <Button
            icon="zoom-in-line"
            size="xs"
            variant="outlined"
            className="ml-auto h-fit"
            href={href}
          >
            Afficher le détail
          </Button>
        ) : (
          <Button
            icon="zoom-in-line"
            size="xs"
            variant="outlined"
            onClick={handleZoom}
            className="ml-auto h-fit"
          />
        )}
      </div>
      {renderGraph({ isOpen, setIsOpen: toggleOpen })}
    </AccueilCard>
  );
};
