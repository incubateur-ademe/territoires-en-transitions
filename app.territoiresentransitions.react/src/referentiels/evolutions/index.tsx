'use client';

import { useState, useEffect } from 'react';
import { EmptyCard, Badge } from '@/ui';
import ScoreTotalEvolutionsChart from './charts/ScoreTotalEvolutionsChart';
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

  const { data: snapshotList } = useSnapshotList();

  const snapshots = removeScoreCourant(snapshotList?.snapshots ?? []);
  const hasSavedSnapshots = !!snapshots?.length;

  const allSnapsNames = snapshots?.map((snap) => snap?.nom);
  const dropdownOptions =
    allSnapsNames?.map((snap, index) => ({
      value: snap ?? '',
      label: snap ?? '',
      date: snapshots[index]?.date ?? '',
    })) ?? [];

  const initialDisplaySnapsNames = organizeSnaps(snapshots)?.map(
    (snap) => snap?.nom
  );

  const [selectedSnapshots, setSelectedSnapshots] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isInitialized && initialDisplaySnapsNames.length > 0) {
      setSelectedSnapshots(initialDisplaySnapsNames);
      setIsInitialized(true);
    }
  }, [initialDisplaySnapsNames, isInitialized]);

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
          <div>
            <label className="mb-2">
              Sélectionner les versions à afficher :
            </label>
            <div className="flex items-center justify-between">
              <div className="w-full max-w-4xl">
                <SnapshotsDropdown
                  values={selectedSnapshots ?? []}
                  onChange={({ snapshots }) => {
                    setSelectedSnapshots(snapshots);
                  }}
                  options={dropdownOptions}
                />
              </div>
              <Badge title="Score total" />
            </div>
          </div>
          <div>
            <ScoreTotalEvolutionsChart
              allSnapshots={getSelectedSnapshots(selectedSnapshots)}
            />
          </div>
        </>
      )}
    </>
  );
};

const removeScoreCourant = (snapshots: SnapshotDetails[]) => {
  return snapshots.filter((snap) => snap?.nom !== 'Score courant');
};

const organizeSnaps = (snapshots: SnapshotDetails[]) => {
  const invertedSnapshots = snapshots.reverse();
  const limitedSnapshots = limitSnapshots(invertedSnapshots);
  return limitedSnapshots;
};

const limitSnapshots = (snapshots: SnapshotDetails[]) => {
  const HOW_MANY_SNAPSHOTS_TO_SHOW_BY_DEFAULT = 4;
  if (snapshots.length > HOW_MANY_SNAPSHOTS_TO_SHOW_BY_DEFAULT) {
    return snapshots.slice(0, HOW_MANY_SNAPSHOTS_TO_SHOW_BY_DEFAULT);
  }
  return snapshots;
};

export default ScoreEvolutions;
