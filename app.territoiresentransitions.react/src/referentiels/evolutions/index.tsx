'use client';

import { useState } from 'react';
import VersionsDropdown from './VersionsDropdown';
import { ButtonGroup, EmptyCard } from '@/ui';
import ScoreEvolutionsTotalChart from './charts/ScoreEvolutionsTotalChart';
import PictoDashboard from '../../ui/pictogrammes/PictoDashboard';
import { useSnapshotList } from '../use-snapshot';
// import { fakeScoreSnapshots } from './mocks/fake-score-snapshots';

export const ScoreEvolutions = () => {
  const [versions, setVersions] = useState<number[]>([1, 2]);
  const [activeButtonId, setActiveButtonId] = useState<string>('total');

  const { data: snapshots } = useSnapshotList();
  // console.log('snapshots', snapshots);

  const hasSavedVersions = true;

  return (
    <>
      {hasSavedVersions && (
        <>
          <div className="flex items-end justify-between">
            <VersionsDropdown
              values={versions}
              onChange={({ versions }) => setVersions(versions)}
            />
            <ButtonGroup
              activeButtonId={activeButtonId}
              buttons={[
                {
                  id: 'total',
                  children: 'Total',
                  onClick: () => setActiveButtonId('total'),
                },
                {
                  id: 'axe',
                  children: 'Par axe',
                  onClick: () => setActiveButtonId('axe'),
                },
                {
                  id: 'action',
                  children: 'Par action',
                  onClick: () => setActiveButtonId('action'),
                },
              ]}
              className="justify-end"
            />
          </div>
          <div>
            <ScoreEvolutionsTotalChart snapshots={snapshots?.snapshots || []} />
          </div>
        </>
      )}
      {!hasSavedVersions && (
        <div className="flex items-center justify-center">
          <EmptyCard
            picto={(props) => <PictoDashboard {...props} />}
            title="Aucune version du référentiel n'est figée."
            description="Figer le référentiel vous permet de sauvegarder une version à une date donnée, afin de pouvoir comparer l'évolution du score sur plusieurs versions."
            actions={[
              {
                children: 'Figer le référentiel à une date antérieure',
                onClick: () => {},
                variant: 'outlined',
                size: 'sm',
              },
              {
                children: 'Figer le référentiel',
                onClick: () => {},
                size: 'sm',
              },
            ]}
          />
        </div>
      )}
    </>
  );
};

export default ScoreEvolutions;
