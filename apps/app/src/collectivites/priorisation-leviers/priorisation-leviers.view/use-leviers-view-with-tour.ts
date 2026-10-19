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
  onTourEnded: () => void;
};

type LeviersViewWithTour = Pick<GuidedTour, 'Tour'> & {
  view: LeviersView;
  setView: (view: LeviersView) => void;
  restartOnMatrix: () => void;
  isTourOver: boolean;
};

const useLeviersViewWithTour = ({
  isTourReady,
  levierToPrioritizeId,
  levierSidePanel,
  onTourEnded,
}: UseLeviersViewWithTourArgs): LeviersViewWithTour => {
  const { Tour, isOver, restart } = usePriorisationTour({
    isReady: isTourReady,
    levierToPrioritizeId,
    levierSidePanel,
    onEnded: onTourEnded,
  });
  const [view, setView] = useState<LeviersView>('matrix');
  const restartOnMatrix = useCallback(() => {
    setView('matrix');
    restart();
  }, [restart]);

  return { Tour, view, setView, restartOnMatrix, isTourOver: isOver };
};

export { useLeviersViewWithTour };
