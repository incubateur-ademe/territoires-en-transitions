'use client';

import { appLabels } from '@/app/labels/catalog';
import { designTokens } from '@tet/design-tokens';
import { JSX, useEffect, useEffectEvent, useMemo } from 'react';
import { Step, useJoyride } from 'react-joyride';
import { GuidedTourTooltip } from './guided-tour.tooltip';
import { useSeenGuidedTourVersion } from './use-seen-guided-tour-version';

const TARGET_WAIT_TIMEOUT = 5000;

type UseGuidedTourArgs = {
  id: string;
  version: string;
  steps: readonly Step[];
  isReady: boolean;
  onSkipped?: () => void;
};

export type GuidedTour = {
  Tour: JSX.Element | null;
  restart: () => void;
};

export const useGuidedTour = ({
  id,
  version,
  steps,
  isReady,
  onSkipped,
}: UseGuidedTourArgs): GuidedTour => {
  const { hasSeen, markSeen } = useSeenGuidedTourVersion({ id, version });
  const shouldRun = isReady && !hasSeen;
  const stepsWithDefaults = useMemo(
    () =>
      steps.map((step) => ({
        skipBeacon: true,
        targetWaitTimeout: TARGET_WAIT_TIMEOUT,
        ...step,
      })),
    [steps]
  );
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

  return { Tour, restart: () => controls.start() };
};
