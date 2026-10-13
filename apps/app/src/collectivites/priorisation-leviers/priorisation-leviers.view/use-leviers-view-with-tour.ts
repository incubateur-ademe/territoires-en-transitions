'use client';

import { GuidedTour } from '@/app/shared/guided-tour/use-guided-tour';
import { useCallback, useState } from 'react';
import { usePriorisationTour } from '../priorisation-tour/use-priorisation-tour';
import { LeviersView } from './leviers-view';

type LeviersViewWithTour = Pick<GuidedTour, 'Tour'> & {
  view: LeviersView;
  setView: (view: LeviersView) => void;
  restartOnMatrix: () => void;
};

const useLeviersViewWithTour = ({
  isTourReady,
}: {
  isTourReady: boolean;
}): LeviersViewWithTour => {
  const { Tour, restart } = usePriorisationTour({ isReady: isTourReady });
  const [view, setView] = useState<LeviersView>('matrix');
  const restartOnMatrix = useCallback(() => {
    setView('matrix');
    restart();
  }, [restart]);

  return { Tour, view, setView, restartOnMatrix };
};

export { useLeviersViewWithTour };
