'use client';
import { EvolutionsSnapshotsDropdown } from '@/app/referentiels/comparisons/dropdowns/evolutions-snapshots.dropdown';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Badge, EmptyCard } from '@tet/ui';
import { useEffect, useState } from 'react';
import SaveScoreButton from '../../app/pages/collectivite/Referentiels/SaveScore/save-score.button';
import PictoDashboard from '../../ui/pictogrammes/PictoDashboard';
import { useReferentielId } from '../referentiel-context';
import { useListSnapshots } from '../use-snapshot';
import { ScoreTotalEvolutionsChart } from './evolutions-score-total.chart';

export const ScoreEvolutions = () => {
  const referentielId = useReferentielId();
  const { isReadOnly, collectiviteId } = useCurrentCollectivite();

  const { data: snapshots } = useListSnapshots({
    referentielId,
  });

  // State management for the dropdown and the chart
  const [selectedSnapshots, setSelectedSnapshots] = useState<typeof snapshots>(
    []
  );

  useEffect(() => {
    if (snapshots) {
      setSelectedSnapshots(snapshots.slice(0, 4));
    }
  }, [snapshots]);

  if (!snapshots) {
    return <SpinnerLoader className="m-auto" />;
  }

  if (snapshots.length) {
    return (
      <div className="px-4">
        <div>
          <label className="mb-2">
            Sélectionner les sauvegardes à afficher :
          </label>
          <div className="flex items-center justify-between">
            <div className="w-full max-w-6xl">
              <EvolutionsSnapshotsDropdown
                values={selectedSnapshots ?? []}
                onChange={setSelectedSnapshots}
                options={snapshots}
                maxBadgesToShow={3}
              />
            </div>
            <Badge title="Score total" />
          </div>
        </div>
        <div className="mt-8 pt-4 border-t border-gray-200">
          <ScoreTotalEvolutionsChart
            snapshots={selectedSnapshots ?? []}
            chartSize="lg"
            referentielId={referentielId}
            isDownloadable
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center">
      <EmptyCard
        picto={(props) => <PictoDashboard {...props} />}
        title="Aucune version du référentiel n'est figée."
        description="Figer l'état des lieux vous permet de sauvegarder une version à une date donnée, afin de pouvoir comparer l'évolution du score sur plusieurs versions."
        isReadonly={isReadOnly}
        actions={[
          <SaveScoreButton
            key="before"
            referentielId={referentielId}
            collectiviteId={collectiviteId}
            label="Figer l'état des lieux à une date antérieure"
            when="before"
            variant="outlined"
          />,
          <SaveScoreButton
            key="after"
            referentielId={referentielId}
            collectiviteId={collectiviteId}
            label="Figer l'état des lieux"
            variant="primary"
          />,
        ]}
      />
    </div>
  );
};
