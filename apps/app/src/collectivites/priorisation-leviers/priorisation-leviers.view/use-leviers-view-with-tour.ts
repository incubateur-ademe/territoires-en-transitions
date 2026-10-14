'use client';

import { GuidedTour } from '@/app/shared/guided-tour/use-guided-tour';
import { LevierId } from '@tet/domain/shared';
import { useCallback, useState } from 'react';
import { usePriorisationTour } from '../priorisation-tour/use-priorisation-tour';
import { LeviersView } from './leviers-view';
import { LevierSidePanelControls } from './levier-panel/use-levier-side-panel';

type UseLeviersViewWithTourArgs = {
  isTourReady: boolean;
  levierToPrioritizeId?: LevierId;
  levierSidePanel: LevierSidePanelControls;
};

type LeviersViewWithTour = Pick<GuidedTour, 'Tour'> & {
  view: LeviersView;
  setView: (view: LeviersView) => void;
  restartOnMatrix: () => void;
};

const useLeviersViewWithTour = ({
  isTourReady,
  levierToPrioritizeId,
  levierSidePanel,
}: UseLeviersViewWithTourArgs): LeviersViewWithTour => {
  const { Tour, restart } = usePriorisationTour({
    isReady: isTourReady,
    levierToPrioritizeId,
    levierSidePanel,
  });
  const [view, setView] = useState<LeviersView>('matrix');
  const restartOnMatrix = useCallback(() => {
    setView('matrix');
    restart();
  }, [restart]);

  return { Tour, view, setView, restartOnMatrix };
};

export { useLeviersViewWithTour };
