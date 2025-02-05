'use client';

import { useState, useEffect } from 'react';

import { EmptyCard, Badge } from '@/ui';
import ScoreEvolutionsTotalChart from './charts/ScoreEvolutionsTotalChart';
import PictoDashboard from '../../ui/pictogrammes/PictoDashboard';
import { SnapshotDetails, useSnapshotList } from '../use-snapshot';
import SaveScoreModal from '../../app/pages/collectivite/Referentiels/SaveScore/save-score.modal';
import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import { useParams } from 'next/navigation';
import SnapshotsDropdown from './SnapshotsDropdown';

export const ScoreEvolutions = () => {
  const { referentielId } = useParams();
  const collectivite = useCurrentCollectivite();
  const collectiviteId = collectivite?.collectiviteId;

  const HOW_MANY_SNAPSHOTS_TO_SHOW = 4;

  const { data: snapshotList } = useSnapshotList({
    limit: HOW_MANY_SNAPSHOTS_TO_SHOW,
    mostRecentFirst: true,
  });
  const hasSavedSnapshots = !!snapshotList;
  const snapshots = snapshotList?.snapshots ?? [];

  const snapshotNames = snapshots.map((snap) => snap?.nom);

  const [selectedSnapshots, setSelectedSnapshots] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isInitialized && snapshotNames.length > 0) {
      setSelectedSnapshots(snapshotNames);
      setIsInitialized(true);
    }
  }, [snapshotNames, isInitialized]);

  const dropdownOptions =
    snapshotNames?.map((snap, index) => ({
      value: snap ?? '',
      label: snap ?? '',
      date: snapshots[index]?.date ?? '',
    })) ?? [];

  const getSelectedSnapshots = (names: string[]) => {
    return names
      ?.map((name) => snapshots.find((snap) => snap?.nom === name) ?? null)
      .filter((snap): snap is SnapshotDetails => snap !== null);
  };

  return (
    <>
      {!hasSavedSnapshots && (
        <div className="flex items-center justify-center">
          <EmptyCard
            picto={(props) => <PictoDashboard {...props} />}
            title="Aucune version du référentiel n'est figée."
            description="Figer l'état des lieux vous permet de sauvegarder une version à une date donnée, afin de pouvoir comparer l'évolution du score sur plusieurs versions."
            actions={[
              {
                children: (
                  <SaveScoreModal
                    referentielId={referentielId as string}
                    collectiviteId={collectiviteId as number}
                    when="before"
                  >
                    <span>Figer l'état des lieux à une date antérieure</span>
                  </SaveScoreModal>
                ),
                onClick: () => {},
                size: 'sm',
                variant: 'outlined',
              },
              {
                children: (
                  <SaveScoreModal
                    referentielId={referentielId as string}
                    collectiviteId={collectiviteId as number}
                  >
                    <span>Figer l'état des lieux</span>
                  </SaveScoreModal>
                ),
                onClick: () => {},
                size: 'sm',
              },
            ]}
          />
        </div>
      )}
      {hasSavedSnapshots && (
        <>
          <div className="flex items-end justify-between">
            <SnapshotsDropdown
              values={selectedSnapshots ?? []}
              onChange={({ snapshots }) => {
                setSelectedSnapshots(snapshots);
              }}
              options={dropdownOptions}
            />
            <Badge title="Score total" />
          </div>
          <div>
            <ScoreEvolutionsTotalChart
              snapshots={getSelectedSnapshots(selectedSnapshots)}
            />
          </div>
        </>
      )}
    </>
  );
};

export default ScoreEvolutions;
