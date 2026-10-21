'use client';

import { appLabels } from '@/app/labels/catalog';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { Alert, Button, Icon, VisibleWhen } from '@tet/ui';
import { cn } from '@tet/ui/utils/cn';
import { ImportStepName, ImportStepView } from './ai-import-steps.model';

const STEP_LABELS: Record<ImportStepName, string> = {
  reading: appLabels.importPlanIaEtapeLecture,
  scouting: appLabels.importPlanIaEtapeReperage,
  extraction: appLabels.importPlanIaEtapeExtraction,
  hierarchy: appLabels.importPlanIaEtapeHierarchie,
  scoring: appLabels.importPlanIaEtapeVerification,
  consolidation: appLabels.importPlanIaEtapeConsolidation,
  enrichment: appLabels.importPlanIaEtapeEnrichissement,
  secteurs: appLabels.importPlanIaEtapeSecteurs,
  qualitativeReview: appLabels.importPlanIaEtapeRevue,
};

// Hors PCAET, l'étape ne propose que les effets attendus.
const stepLabelsFor = (withSecteurs: boolean): Record<ImportStepName, string> =>
  withSecteurs
    ? STEP_LABELS
    : { ...STEP_LABELS, secteurs: appLabels.importPlanIaEtapeEffetsAttendus };

const ImportFailedAlert = ({
  errorMessage,
  onRetry,
  onResume,
  isResuming,
}: {
  errorMessage: string | null;
  onRetry: () => void;
  onResume?: () => void;
  isResuming: boolean;
}) => (
  <div role="alert" className="flex flex-col items-center gap-6">
    <Alert
      state="error"
      title={appLabels.importPlanIaErreur}
      description={errorMessage ?? undefined}
    />
    <div className="flex flex-wrap justify-center gap-4">
      <Button variant="outlined" onClick={onRetry}>
        {appLabels.reessayer}
      </Button>
      {onResume ? (
        <Button
          onClick={onResume}
          disabled={isResuming}
          data-test="plans.import-ia.reprendre-button"
        >
          {appLabels.importPlanIaReprendre}
        </Button>
      ) : null}
    </div>
  </div>
);

const statusLabels: Record<VisibleStepStatus, string> = {
  done: appLabels.importPlanIaEtapeTerminee,
  current: appLabels.importPlanIaEtapeEnCours,
  waiting: appLabels.importPlanIaEtapeEnAttente,
  failed: appLabels.importPlanIaEtapeEnEchec,
};

type VisibleStepStatus = Exclude<ImportStepView['status'], 'skipped'>;

type VisibleStep = ImportStepView & { status: VisibleStepStatus };

const StepStatusIcon = ({ status }: { status: VisibleStepStatus }) => {
  switch (status) {
    case 'done':
      return (
        <Icon
          icon="checkbox-circle-fill"
          size="lg"
          className="text-success-1"
        />
      );
    case 'failed':
      return (
        <Icon icon="close-circle-fill" size="lg" className="text-error-1" />
      );
    case 'current':
      return <SpinnerLoader className="w-6 h-6 shrink-0" />;
    case 'waiting':
      return (
        <span className="w-6 h-6 shrink-0 p-0.5">
          <span className="block w-full h-full rounded-full border-2 border-grey-4" />
        </span>
      );
  }
};

// Une étape sautée ne se fait pas : la lister ferait croire à du travail.
const isVisible = (step: ImportStepView): step is VisibleStep =>
  step.status !== 'skipped';

const ImportStepList = ({
  steps,
  withSecteurs,
}: {
  steps: ImportStepView[];
  withSecteurs: boolean;
}) => {
  const stepLabels = stepLabelsFor(withSecteurs);
  const currentSteps = steps.filter((step) => step.status === 'current');
  return (
    <>
      <p role="status" aria-live="polite" className="sr-only">
        {currentSteps.map((step) => `${stepLabels[step.name]}…`).join(' ')}
      </p>
      <ol
        aria-label={appLabels.importPlanIaEtapesTitre}
        className="flex flex-col gap-3 mb-0 p-0 list-none"
        data-test="plans.import-ia.etapes"
      >
        {steps.filter(isVisible).map((step) => (
          <li
            key={step.name}
            data-status={step.status}
            className="flex items-center gap-3 p-0"
          >
            <StepStatusIcon status={step.status} />
            <span
              className={cn('text-base', {
                'font-bold text-primary-9': step.status === 'current',
                'text-grey-6': step.status === 'waiting',
                'text-error-1': step.status === 'failed',
              })}
            >
              {stepLabels[step.name]}
              <span className="sr-only">
                {` (${statusLabels[step.status]})`}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </>
  );
};

type AiImportProgressProps = {
  failed: boolean;
  errorMessage: string | null;
  onRetry: () => void;
  /** Reprise depuis la dernière étape terminée : réservée à l'équipe. */
  onResume?: () => void;
  isResuming?: boolean;
  steps: ImportStepView[];
  /** Plan PCAET : l'import propose aussi les secteurs réglementaires. */
  withSecteurs?: boolean;
};

export const AiImportProgress = ({
  failed,
  errorMessage,
  onRetry,
  onResume,
  isResuming = false,
  steps,
  withSecteurs = false,
}: AiImportProgressProps) => (
  <div className="flex flex-col gap-8 py-10">
    <ImportStepList steps={steps} withSecteurs={withSecteurs} />
    <VisibleWhen condition={failed}>
      <ImportFailedAlert
        errorMessage={errorMessage}
        onRetry={onRetry}
        onResume={onResume}
        isResuming={isResuming}
      />
    </VisibleWhen>
    <VisibleWhen condition={!failed}>
      <p className="mb-0 text-sm text-grey-7">
        {appLabels.importPlanIaEnCours}
      </p>
    </VisibleWhen>
  </div>
);
