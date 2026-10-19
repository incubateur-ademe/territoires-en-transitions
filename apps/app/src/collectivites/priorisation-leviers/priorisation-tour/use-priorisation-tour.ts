'use client';

import {
  GuidedTour,
  useGuidedTour,
} from '@/app/shared/guided-tour/use-guided-tour';
import type { LevierId } from '@tet/domain/shared';
import { useCallback, useMemo } from 'react';
import type { LevierSidePanelControls } from '../priorisation-leviers.view/levier-panel/use-levier-side-panel';
import { toPriorisationTourSteps } from './priorisation-tour.steps';
import {
  PRIORISATION_TOUR_ID,
  priorisationTargets,
} from './priorisation-tour.targets';

const TOUR_VERSION = '2026-10';

type UsePriorisationTourArgs = {
  isReady: boolean;
  levierToPrioritizeId?: LevierId;
  levierSidePanel: LevierSidePanelControls;
  onEnded: () => void;
};

const usePriorisationTour = ({
  isReady,
  levierToPrioritizeId,
  levierSidePanel: { select, close },
  onEnded,
}: UsePriorisationTourArgs): GuidedTour => {
  const resolve = priorisationTargets.useResolve();
  const steps = useMemo(
    () => toPriorisationTourSteps({ resolve, levierToPrioritizeId, select }),
    [resolve, levierToPrioritizeId, select]
  );

  const endTour = useCallback(() => {
    close();
    onEnded();
  }, [close, onEnded]);

  return useGuidedTour({
    id: PRIORISATION_TOUR_ID,
    version: TOUR_VERSION,
    steps,
    isReady,
    onEnded: endTour,
  });
};

export { usePriorisationTour };
