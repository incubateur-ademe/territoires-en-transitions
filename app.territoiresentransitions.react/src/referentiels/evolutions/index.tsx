'use client';
import { useState, useEffect } from 'react';
import { EmptyCard, Badge } from '@/ui';
import { ScoreTotalEvolutionsChart } from './evolutions-score-total.chart';
import PictoDashboard from '../../ui/pictogrammes/PictoDashboard';
import { SnapshotDetails, useSnapshotList } from '../use-snapshot';
import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import { SnapshotsDropdown } from './evolutions-snapshots.dropdown';
import { useReferentielId } from '../referentiel-context';
import SaveScoreButton from '../../app/pages/collectivite/Referentiels/SaveScore/save-score.button';

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

export const ScoreEvolutions = () => {
  const referentielId = useReferentielId();
  const collectivite = useCurrentCollectivite();
  const collectiviteId = collectivite?.collectiviteId;

  const { data: snapshotList } = useSnapshotList(referentielId);

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

  if (hasSavedSnapshots) {
    return (
      <>
        <div>
          <label className="mb-2">Sélectionner les versions à afficher :</label>
          <div className="flex items-center justify-between">
            <div className="w-full max-w-6xl">
              <SnapshotsDropdown
                values={selectedSnapshots ?? []}
                onChange={({ snapshots }) => {
                  setSelectedSnapshots(snapshots);
                }}
                options={dropdownOptions}
                maxBadgesToShow={3}
              />
            </div>
            <Badge title="Score total" />
          </div>
        </div>
        <div>
          <ScoreTotalEvolutionsChart
            allSnapshots={getSelectedSnapshots(selectedSnapshots)}
            chartSize="lg"
          />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex items-center justify-center">
        <EmptyCard
          picto={(props) => <PictoDashboard {...props} />}
          title="Aucune version du référentiel n'est figée."
          description="Figer l'état des lieux vous permet de sauvegarder une version à une date donnée, afin de pouvoir comparer l'évolution du score sur plusieurs versions."
          isReadonly={collectivite?.isReadOnly}
          actions={[
            <SaveScoreButton
              referentielId={referentielId}
              collectiviteId={collectiviteId as number}
              label="Figer l'état des lieux à une date antérieure"
              when="before"
              variant="outlined"
            />,
            <SaveScoreButton
              referentielId={referentielId}
              collectiviteId={collectiviteId as number}
              label="Figer l'état des lieux"
              variant="primary"
            />,
          ]}
        />
      </div>
    </>
  );
};
