'use client';
import { EvolutionsSnapshotsDropdown } from '@/app/referentiels/comparisons/dropdowns/evolutions-snapshots.dropdown';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Badge, EmptyCard } from '@tet/ui';
import { useState } from 'react';
import { SaveScoreModal } from '../../app/pages/collectivite/Referentiels/SaveScore/save-score.modal';
import PictoDashboard from '../../ui/pictogrammes/PictoDashboard';
import { useReferentielId } from '../referentiel-context';
import { SnapshotListItem, useListSnapshots } from '../use-snapshot';
import { ScoreTotalEvolutionsChart } from './evolutions-score-total.chart';

export const ScoreEvolutions = () => {
  const referentielId = useReferentielId();
  const { hasCollectivitePermission, collectiviteId } =
    useCurrentCollectivite();

  const { data: snapshots, isPending } = useListSnapshots({
    referentielId,
  });

  // State management for the dropdown and the chart
  const [selectedSnapshots, setSelectedSnapshots] = useState<
    SnapshotListItem[]
  >([]);

  const [isModalOpen, setIsModalOpen] = useState(false);

  if (isPending || !snapshots) {
    return <SpinnerLoader className="m-auto" />;
  }

  const visibleSnapshots =
    selectedSnapshots.length > 0
      ? selectedSnapshots
      : snapshots.slice(0, 4) ?? [];

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
                values={visibleSnapshots ?? []}
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
            snapshots={visibleSnapshots ?? []}
            chartSize="lg"
            referentielId={referentielId}
            isDownloadable
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <EmptyCard
        picto={(props) => <PictoDashboard {...props} />}
        title="Aucune version du référentiel à comparer !"
        description="Vous pouvez figer l'état des lieux maintenant ou à une date antérieure pour pouvoir comparer l'évolution du score entre plusieurs versions."
        isReadonly={!hasCollectivitePermission('referentiels.mutate')}
        actions={[
          {
            children: "Figer l'état des lieux",
            icon: 'camera-line',
            onClick: () => setIsModalOpen(true),
            dataTest: 'referentiels.snapshots.figer-referentiel-button',
          },
        ]}
      />
      {isModalOpen && (
        <SaveScoreModal
          collectiviteId={collectiviteId}
          referentielId={referentielId}
          openState={{
            isOpen: isModalOpen,
            setIsOpen: setIsModalOpen,
          }}
        />
      )}
    </>
  );
};
