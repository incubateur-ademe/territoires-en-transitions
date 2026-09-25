'use client';

import { appLabels } from '@/app/labels/catalog';
import { Alert, Button, VisibleWhen } from '@tet/ui';
import { ImportStepName, ImportStepView } from './ai-import-steps.model';

const stepLabels: Record<ImportStepName, string> = {
  extraction: appLabels.importPlanIaEtapeExtraction,
  scoring: appLabels.importPlanIaEtapeVerification,
  consolidation: appLabels.importPlanIaEtapeConsolidation,
  enrichment: appLabels.importPlanIaEtapeEnrichissement,
  qualitativeReview: appLabels.importPlanIaEtapeRevue,
};

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

const toProgressPercent = (steps: ImportStepView[]) => {
  const finished = steps.filter(
    (step) => step.status === 'done' || step.status === 'skipped'
  ).length;
  // L'étape en cours compte pour moitié : la barre bouge dès le lancement.
  const current = steps.some((step) => step.status === 'current') ? 0.5 : 0;
  return Math.round(((finished + current) / steps.length) * 100);
};

const ImportStepProgress = ({ steps }: { steps: ImportStepView[] }) => {
  const currentStep = steps.find((step) => step.status === 'current');
  const percent = toProgressPercent(steps);
  return (
    <div className="flex flex-col items-center gap-4">
      <p
        role="status"
        aria-live="polite"
        className="mb-0 text-lg font-bold text-primary-9"
      >
        {currentStep ? `${stepLabels[currentStep.name]}…` : ''}
      </p>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="w-full h-2 overflow-hidden rounded-full bg-grey-3"
      >
        <div
          className="h-full rounded-full bg-primary-6 transition-[width] duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mb-0 text-sm text-grey-7">
        {appLabels.importPlanIaEnCours}
      </p>
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
      <ImportStepProgress steps={steps} />
    </VisibleWhen>
  </div>
);
