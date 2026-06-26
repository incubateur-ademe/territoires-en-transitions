'use client';

import { appLabels } from '@/app/labels/catalog';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { Alert, Button, Icon, VisibleWhen } from '@tet/ui';
import { ComponentProps } from 'react';
import {
  ImportStepDisplayStatus,
  ImportStepName,
  ImportStepView,
} from './ai-import-steps.model';

const stepLabels: Record<ImportStepName, string> = {
  extraction: appLabels.importPlanIaEtapeExtraction,
  scoring: appLabels.importPlanIaEtapeVerification,
  consolidation: appLabels.importPlanIaEtapeConsolidation,
  enrichment: appLabels.importPlanIaEtapeEnrichissement,
  qualitativeReview: appLabels.importPlanIaEtapeRevue,
};

const stepStatusLabels: Record<ImportStepDisplayStatus, string> = {
  done: appLabels.importPlanIaEtapeStatutTermine,
  skipped: appLabels.importPlanIaEtapeStatutIgnoree,
  current: appLabels.importPlanIaEtapeStatutEnCours,
  waiting: appLabels.importPlanIaEtapeStatutEnAttente,
};

const stepIndicatorByStatus: Record<
  Exclude<ImportStepDisplayStatus, 'current'>,
  { icon: ComponentProps<typeof Icon>['icon']; className: string }
> = {
  done: { icon: 'checkbox-circle-fill', className: 'text-success-1' },
  skipped: { icon: 'subtract-line', className: 'text-grey-6' },
  waiting: { icon: 'checkbox-blank-circle-line', className: 'text-grey-6' },
};

const StepIndicator = ({ status }: { status: ImportStepDisplayStatus }) => {
  if (status === 'current') {
    return <SpinnerLoader className="w-5 h-5" />;
  }
  const indicator = stepIndicatorByStatus[status];
  return <Icon icon={indicator.icon} size="md" className={indicator.className} />;
};

const ImportStepRow = ({ step }: { step: ImportStepView }) => (
  <li className="flex items-center justify-between gap-3">
    <span className="flex items-center gap-3">
      <StepIndicator status={step.status} />
      <span className="text-grey-9">{stepLabels[step.name]}</span>
    </span>
    <span className="text-sm text-grey-7">{stepStatusLabels[step.status]}</span>
  </li>
);

const ImportFailedAlert = ({
  errorMessage,
  onRetry,
}: {
  errorMessage: string | null;
  onRetry: () => void;
}) => (
  <div role="alert" className="flex flex-col items-center gap-6">
    <Alert
      state="error"
      title={appLabels.importPlanIaErreur}
      description={errorMessage ?? undefined}
    />
    <Button variant="outlined" onClick={onRetry}>
      {appLabels.importPlanIaReessayer}
    </Button>
  </div>
);

const ImportStepList = ({ steps }: { steps: ImportStepView[] }) => {
  const currentStep = steps.find((step) => step.status === 'current');
  return (
    <div className="flex flex-col gap-6">
      <p role="status" aria-live="polite" className="sr-only">
        {currentStep
          ? `${appLabels.importPlanIaEtapeEnCoursAnnonce} : ${
              stepLabels[currentStep.name]
            }`
          : ''}
      </p>
      <p className="mb-0 text-grey-7">{appLabels.importPlanIaEnCours}</p>
      <ol className="flex flex-col gap-3 w-full max-w-md mx-auto">
        {steps.map((step) => (
          <ImportStepRow key={step.name} step={step} />
        ))}
      </ol>
    </div>
  );
};

type AiImportProgressProps = {
  failed: boolean;
  errorMessage: string | null;
  onRetry: () => void;
  steps: ImportStepView[];
};

export const AiImportProgress = ({
  failed,
  errorMessage,
  onRetry,
  steps,
}: AiImportProgressProps) => (
  <div className="flex flex-col gap-6 py-10">
    <VisibleWhen condition={failed}>
      <ImportFailedAlert errorMessage={errorMessage} onRetry={onRetry} />
    </VisibleWhen>
    <VisibleWhen condition={!failed}>
      <ImportStepList steps={steps} />
    </VisibleWhen>
  </div>
);
