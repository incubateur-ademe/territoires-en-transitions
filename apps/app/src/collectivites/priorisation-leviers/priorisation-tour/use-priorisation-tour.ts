'use client';

import {
  GuidedTour,
  useGuidedTour,
} from '@/app/shared/guided-tour/use-guided-tour';
import { useMemo } from 'react';
import { toPriorisationTourSteps } from './priorisation-tour.steps';
import {
  PRIORISATION_TOUR_ID,
  priorisationTargets,
} from './priorisation-tour.targets';

const TOUR_VERSION = '2026-10';

export const usePriorisationTour = ({
  isReady,
}: {
  isReady: boolean;
}): GuidedTour => {
  const resolve = priorisationTargets.useResolve();
  const steps = useMemo(() => toPriorisationTourSteps({ resolve }), [resolve]);

  return useGuidedTour({
    id: PRIORISATION_TOUR_ID,
    version: TOUR_VERSION,
    steps,
    isReady,
  });
};
