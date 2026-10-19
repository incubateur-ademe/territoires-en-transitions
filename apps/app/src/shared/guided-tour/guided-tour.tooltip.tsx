'use client';

import { appLabels } from '@/app/labels/catalog';
import { Badge, Button, VisibleWhen } from '@tet/ui';
import { pick } from 'es-toolkit';
import { JSX, ReactNode, useId } from 'react';
import type { Step, TooltipRenderProps } from 'react-joyride';
import { z } from 'zod';

type GuidedTourProgressBarProps = {
  current: number;
  total: number;
};

type GuidedTourHeaderProps = Pick<TooltipRenderProps, 'closeProps'> & {
  current: number;
  total: number;
};

const guidedTourStepDataSchema = z.object({
  nextLabel: z.string().optional(),
  welcome: z.object({ badge: z.string() }).optional(),
  welcomeStepCount: z.number().optional(),
});

type GuidedTourWelcomeProps = Pick<
  TooltipRenderProps,
  'primaryProps' | 'skipProps' | 'tooltipProps'
> & {
  badge: string;
  title: ReactNode;
  content: ReactNode;
  primaryLabel: string;
};

type GuidedTourStepData = z.output<typeof guidedTourStepDataSchema>;

type GuidedTourStep = Omit<Step, 'data'> & { data?: GuidedTourStepData };

type GuidedTourFooterProps = Pick<
  TooltipRenderProps,
  'backProps' | 'primaryProps' | 'skipProps'
> & {
  hasPreviousStep: boolean;
  primaryLabel: string;
};

const toPrimaryLabel = ({
  data,
  isLastStep,
}: Pick<TooltipRenderProps, 'isLastStep'> & {
  data: unknown;
}): string => {
  if (isLastStep) {
    return appLabels.terminer;
  }
  const parsedData = guidedTourStepDataSchema.safeParse(data);
  const customLabel = parsedData.success
    ? parsedData.data.nextLabel
    : undefined;
  return customLabel ?? appLabels.suivant;
};

const GuidedTourProgressBar = ({
  current,
  total,
}: GuidedTourProgressBarProps): JSX.Element => (
  <div
    role="progressbar"
    aria-label={appLabels.visiteGuideeProgression}
    aria-valuemin={0}
    aria-valuemax={total}
    aria-valuenow={current}
    aria-valuetext={appLabels.visiteGuideeEtape({
      index: current,
      size: total,
    })}
    className="h-1 w-full overflow-hidden rounded-full bg-grey-3"
  >
    <div
      className="h-full rounded-full bg-primary-7 transition-[width] duration-200"
      style={{ width: `${(current / total) * 100}%` }}
    />
  </div>
);

const GuidedTourHeader = ({
  closeProps,
  current,
  total,
}: GuidedTourHeaderProps): JSX.Element => (
  <div className="flex items-center justify-between gap-2">
    <span className="text-xs font-medium text-grey-7">
      {appLabels.visiteGuideeEtape({ index: current, size: total })}
    </span>
    <Button
      {...pick(closeProps, [
        'aria-label',
        'data-action',
        'onClick',
        'role',
        'title',
      ])}
      variant="unstyled"
      size="xs"
      icon="close-line"
    />
  </div>
);

const GuidedTourFooter = ({
  backProps,
  hasPreviousStep,
  primaryLabel,
  primaryProps,
  skipProps,
}: GuidedTourFooterProps): JSX.Element => (
  <div className="flex items-center justify-between gap-2">
    <Button {...skipProps} variant="link" size="xs">
      {appLabels.visiteGuideePasser}
    </Button>
    <div className="flex gap-2">
      <VisibleWhen condition={hasPreviousStep}>
        <Button {...backProps} variant="outlined" size="xs">
          {appLabels.precedent}
        </Button>
      </VisibleWhen>
      <Button
        {...primaryProps}
        aria-label={primaryLabel}
        title={primaryLabel}
        size="xs"
      >
        {primaryLabel}
      </Button>
    </div>
  </div>
);

const toWelcome = (data: unknown): GuidedTourStepData['welcome'] =>
  guidedTourStepDataSchema.safeParse(data).data?.welcome;

const toWelcomeStepCount = (data: unknown): number =>
  guidedTourStepDataSchema.safeParse(data).data?.welcomeStepCount ?? 0;

const GuidedTourWelcome = ({
  badge,
  content,
  primaryLabel,
  primaryProps,
  skipProps,
  title,
  tooltipProps,
}: GuidedTourWelcomeProps): JSX.Element => {
  const titleId = useId();
  const contentId = useId();

  return (
    <div
      {...tooltipProps}
      aria-labelledby={titleId}
      aria-describedby={contentId}
      className="flex w-[30rem] max-w-modal-xs flex-col gap-4 rounded-xl bg-white p-6 shadow-card ring-1 ring-inset ring-grey-3"
    >
      <div className="flex">
        <Badge title={badge} size="sm" />
      </div>
      <h2
        id={titleId}
        className="mb-0 text-2xl font-bold leading-9 text-primary-9"
      >
        {title}
      </h2>
      <div id={contentId} className="text-sm">
        {content}
      </div>
      <div className="flex justify-end gap-4 border-t border-grey-3 pt-4">
        <Button {...skipProps} variant="outlined" size="xs">
          {appLabels.visiteGuideePasser}
        </Button>
        <Button
          {...primaryProps}
          aria-label={primaryLabel}
          title={primaryLabel}
          size="xs"
        >
          {primaryLabel}
        </Button>
      </div>
    </div>
  );
};

const GuidedTourTooltip = ({
  backProps,
  closeProps,
  index,
  isLastStep,
  primaryProps,
  size,
  skipProps,
  step,
  tooltipProps,
}: TooltipRenderProps): JSX.Element => {
  const titleId = useId();
  const contentId = useId();
  const hasTitle = step.title !== undefined;
  const labelledById = hasTitle ? titleId : undefined;
  const fallbackLabel = hasTitle ? undefined : appLabels.visiteGuidee;
  const hasPreviousStep = index > 0;
  const welcome = toWelcome(step.data);
  const welcomeStepCount = toWelcomeStepCount(step.data);
  const current = index + 1 - welcomeStepCount;
  const total = size - welcomeStepCount;

  if (welcome !== undefined) {
    return (
      <GuidedTourWelcome
        badge={welcome.badge}
        content={step.content}
        primaryLabel={toPrimaryLabel({ data: step.data, isLastStep })}
        primaryProps={primaryProps}
        skipProps={skipProps}
        title={step.title}
        tooltipProps={tooltipProps}
      />
    );
  }

  return (
    <div
      {...tooltipProps}
      aria-labelledby={labelledById}
      aria-label={fallbackLabel}
      aria-describedby={contentId}
      className="flex w-[30rem] max-w-modal-xs flex-col gap-3 rounded-xl bg-white p-4 shadow-card ring-1 ring-inset ring-primary-7"
    >
      <GuidedTourHeader
        closeProps={closeProps}
        current={current}
        total={total}
      />
      <VisibleWhen condition={hasTitle}>
        <h2
          id={titleId}
          className="mb-0 text-base font-bold leading-6 text-primary-9"
        >
          {step.title}
        </h2>
      </VisibleWhen>
      <div id={contentId} className="text-sm">
        {step.content}
      </div>
      <GuidedTourProgressBar current={current} total={total} />
      <GuidedTourFooter
        backProps={backProps}
        hasPreviousStep={hasPreviousStep}
        primaryLabel={toPrimaryLabel({ data: step.data, isLastStep })}
        primaryProps={primaryProps}
        skipProps={skipProps}
      />
    </div>
  );
};

export { GuidedTourTooltip };
export type { GuidedTourStep, GuidedTourStepData };
