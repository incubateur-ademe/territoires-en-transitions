'use client';

import { appLabels } from '@/app/labels/catalog';
import { designTokens } from '@tet/design-tokens';
import { JSX, useCallback, useEffect, useEffectEvent, useMemo } from 'react';
import { useJoyride } from 'react-joyride';
import { GuidedTourStep, GuidedTourTooltip } from './guided-tour.tooltip';
import { useSeenGuidedTourVersion } from './use-seen-guided-tour-version';

const TARGET_WAIT_TIMEOUT = 5000;

type UseGuidedTourArgs = {
  id: string;
  version: string;
  steps: readonly GuidedTourStep[];
  isReady: boolean;
  onSkipped?: () => void;
};

type GuidedTour = {
  Tour: JSX.Element | null;
  restart: () => void;
};

const useGuidedTour = ({
  id,
  version,
  steps,
  isReady,
  onSkipped,
}: UseGuidedTourArgs): GuidedTour => {
  const { hasSeen, markSeen } = useSeenGuidedTourVersion({ id, version });
  const shouldRun = isReady && !hasSeen;
  const stepsWithDefaults = useMemo(() => {
    const welcomeStepCount = steps.filter(
      ({ data }) => data?.welcome !== undefined
    ).length;
    return steps.map((step) => ({
      skipBeacon: true,
      blockTargetInteraction: true,
      targetWaitTimeout: TARGET_WAIT_TIMEOUT,
      ...step,
      data: { ...step.data, welcomeStepCount },
    }));
  }, [steps]);
  const { controls, on, Tour } = useJoyride({
    continuous: true,
    steps: stepsWithDefaults,
    run: shouldRun,
    tooltipComponent: GuidedTourTooltip,
    floatingOptions: { hideArrow: true },
    locale: {
      back: appLabels.precedent,
      close: appLabels.visiteGuideeQuitter,
      last: appLabels.terminer,
      next: appLabels.suivant,
      skip: appLabels.visiteGuideePasser,
    },
    options: {
      closeButtonAction: 'skip',
      offset: 8,
      spotlightPadding: 8,
      spotlightRadius: 12,
      zIndex: Number(designTokens.zIndex.modal),
    },
  });
  const notifySkipped = useEffectEvent(() => onSkipped?.());
  const restart = useCallback(() => controls.start(), [controls]);

  useEffect(
    () =>
      on('tour:end', ({ status }) => {
        const isSkipped = status === 'skipped';
        const isEndedByUser = isSkipped || status === 'finished';
        if (isEndedByUser) {
          markSeen();
        }
        if (isSkipped) {
          notifySkipped();
        }
      }),
    [on, markSeen]
  );

  return { Tour, restart };
};

export { useGuidedTour };
export type { GuidedTour };
