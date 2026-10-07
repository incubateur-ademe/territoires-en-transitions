'use client';

import { DemoPlayer } from '@/site/components/animated-demo/demo-player';
import { useDemoPlayback } from '@/site/components/animated-demo/use-demo-playback';
import { useMedia } from 'react-use';
import { COMPACT_SCENE, DepotDemoCompact } from './depot-demo-compact';
import { DepotDemoWide, WIDE_SCENE } from './depot-demo-wide';
import {
  DEPOT_TIMELINE,
  FROZEN_SCENE_TIME,
  SCREENS,
} from './depot-demo.scenario';
import { getDepotDemoState } from './depot-demo.state';

const DESCRIPTION =
  "Démonstration animée du parcours de dépôt d'un PCAET dans Territoires en Transitions : ajout des documents, saisie du diagnostic par volet, import du programme d'actions depuis un PDF, transmission pour avis, réception des rapports de la DREAL et de la Région, puis adoption du plan.";

const CHAPTERS = SCREENS.map(({ chapter, start }) => ({
  label: chapter,
  start: DEPOT_TIMELINE.toReal(start),
}));

/** En dessous de `md`, la scène large deviendrait illisible une fois réduite. */
const NARROW_SCREEN_QUERY = '(max-width: 767px)';

export const DepotDemo = () => {
  const playback = useDemoPlayback({
    duration: DEPOT_TIMELINE.duration,
    frozenTime: DEPOT_TIMELINE.toReal(FROZEN_SCENE_TIME),
  });
  const compact = useMedia(NARROW_SCREEN_QUERY, false);
  const sceneTime = DEPOT_TIMELINE.toScene(playback.time);
  const state = getDepotDemoState(sceneTime);
  const scene = compact ? COMPACT_SCENE : WIDE_SCENE;

  return (
    <DemoPlayer
      playback={playback}
      width={scene.width}
      height={scene.height}
      description={DESCRIPTION}
      chapters={CHAPTERS}
      compact={compact}
    >
      {compact ? (
        <DepotDemoCompact state={state} time={sceneTime} />
      ) : (
        <DepotDemoWide state={state} time={sceneTime} />
      )}
    </DemoPlayer>
  );
};
