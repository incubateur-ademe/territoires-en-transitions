'use client';

import { appLabels } from '@/app/labels/catalog';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { Icon } from '@tet/ui';
import { cn } from '@tet/ui/utils/cn';
import { ImportStage, ImportStageView } from './ai-import-stages.model';

// Hors PCAET, la dernière étape ne propose que les effets attendus.
export const getImportStageLabel = (
  stage: ImportStage,
  withSecteurs: boolean
): string =>
  stage === 'secteurs' && !withSecteurs
    ? appLabels.importPlanIaEtapeSimplifieeEffetsAttendus
    : appLabels.importPlanIaEtapesSimplifiees[stage];

export const AiImportProgressBar = ({ percent }: { percent: number }) => (
  <div
    role="progressbar"
    aria-valuemin={0}
    aria-valuemax={100}
    aria-valuenow={percent}
    className="h-2 w-full rounded-full bg-grey-3 overflow-hidden"
  >
    <div
      className="h-full rounded-full bg-primary-7 transition-[width] duration-500"
      style={{ width: `${percent}%` }}
    />
  </div>
);

const StageIcon = ({ status }: { status: ImportStageView['status'] }) => {
  switch (status) {
    case 'done':
      return (
        <Icon
          icon="checkbox-circle-fill"
          size="md"
          className="text-success-1"
        />
      );
    case 'failed':
      return (
        <Icon icon="close-circle-fill" size="md" className="text-error-1" />
      );
    case 'current':
      return <SpinnerLoader className="w-5 h-5 shrink-0" />;
    case 'waiting':
      return (
        <span className="w-5 h-5 shrink-0 p-0.5">
          <span className="block w-full h-full rounded-full border-2 border-grey-4" />
        </span>
      );
  }
};

export const AiImportStagesList = ({
  stages,
  withSecteurs,
}: {
  stages: ImportStageView[];
  withSecteurs: boolean;
}) => (
  <ol
    aria-label={appLabels.importPlanIaEtapesTitre}
    className="flex flex-col gap-3 m-0 p-0 list-none"
    data-test="plans.import-ia.etapes-simplifiees"
  >
    {stages.map(({ stage, status }) => (
      <li
        key={stage}
        data-status={status}
        className="flex items-center gap-3 p-0"
      >
        <StageIcon status={status} />
        <span
          className={cn('text-sm', {
            'font-bold text-primary-9': status === 'current',
            'text-grey-8': status === 'done',
            'text-grey-6': status === 'waiting',
            'text-error-1': status === 'failed',
          })}
        >
          {getImportStageLabel(stage, withSecteurs)}
        </span>
      </li>
    ))}
  </ol>
);
