import {
  makeCollectiviteDemarchePcaetDiagnosticUrl,
  makeCollectiviteDemarchePcaetNouveauUrl,
  makeCollectiviteDemarchePcaetPlanActionsUrl,
  makeCollectiviteDemarchePcaetRootUrl,
} from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { DemarchePcaetStatusEnum } from '@tet/domain/demarches';
import { Badge, Button, Icon, InfoTooltip, Tooltip } from '@tet/ui';
import Link from 'next/link';
import type { ReactNode } from 'react';
import type { DemarchePcaetCompletion } from '../demarche-pcaet-completion';
import type {
  DemarchePcaet,
  DemarchePcaetStatut,
  DemarchePcaetVoletStatut,
} from '../demarche-pcaet.types';

export type DemarchePcaetSectionKey = 'documents' | 'diagnostic' | 'plan';

function diffDays(from: Date, to: Date): number {
  return Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

/** Échéance de remise des avis, figée côté serveur à la transmission. */
function TransmisDeadline({ avisDeadlineAt }: { avisDeadlineAt: string }) {
  const deadline = new Date(avisDeadlineAt);
  const today = new Date();
  const remaining = diffDays(today, deadline);
  const deadlineStr = deadline.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const isOver = remaining < 0;
  const isPending = remaining <= 14;

  return (
    <div
      className={[
        'mt-1 flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs w-fit',
        isOver
          ? 'bg-error-2 text-error-1 border border-error-3'
          : isPending
          ? 'bg-warning-2 text-warning-1 border border-warning-3'
          : 'bg-primary-1 text-primary-8 border border-primary-3',
      ].join(' ')}
    >
      <span className="font-medium">
        {appLabels.demarchePcaetAvanceTransmisEcheance}
      </span>
      <span>{deadlineStr}</span>
      <span
        className={[
          'font-semibold',
          isOver
            ? 'text-error-1'
            : isPending
            ? 'text-warning-1'
            : 'text-primary-7',
        ].join(' ')}
      >
        {isOver
          ? appLabels.demarchePcaetAvanceTransmisDepasse
          : `J\u2011${remaining}`}
      </span>
    </div>
  );
}

type SectionStep = {
  key: DemarchePcaetSectionKey;
  label: string;
  description: string;
  status: DemarchePcaetVoletStatut;
  href: string;
};

const sectionStepCardClassName = (isActive: boolean, isPreview: boolean) =>
  [
    'flex gap-3 rounded-lg border p-3 text-sm transition-colors',
    isActive
      ? 'border-primary-7 border-2 bg-primary-0 p-[calc(0.75rem-1px)]'
      : 'border-grey-3 bg-white',
    !isPreview && !isActive && 'hover:border-primary-4 hover:bg-primary-0',
    isPreview && 'opacity-80',
  ]
    .filter(Boolean)
    .join(' ');

const SectionStepContent = ({
  step,
  isComplete,
}: {
  step: SectionStep;
  isComplete: boolean;
}) => (
  <>
    <div
      className={[
        'flex items-center justify-center rounded-full w-8 h-8 shrink-0',
        isComplete ? 'bg-success text-white' : 'bg-warning-2 text-warning-1',
      ].join(' ')}
    >
      <Icon icon={isComplete ? 'check-line' : 'close-line'} size="sm" />
    </div>
    <div className="flex flex-col gap-1 min-w-0 flex-1">
      <div className="flex items-start justify-between gap-2">
        <span className="font-medium text-primary-9 min-w-0">{step.label}</span>
        <Badge
          className="shrink-0"
          trim={false}
          variant={isComplete ? 'success' : 'warning'}
          size="xs"
          title={
            isComplete
              ? appLabels.demarchePcaetAvanceSectionComplete
              : appLabels.demarchePcaetAvanceSectionIncomplete
          }
        />
      </div>
      <span className="leading-relaxed text-grey-7">{step.description}</span>
    </div>
  </>
);

const SectionStepRow = ({
  step,
  isActive,
  isPreview = false,
}: {
  step: SectionStep;
  isActive: boolean;
  isPreview?: boolean;
}) => {
  const isComplete = step.status === 'complete';

  return (
    <div className="pb-3">
      {isPreview ? (
        <div
          data-test={`demarche-etape-${step.key}`}
          className={sectionStepCardClassName(isActive, isPreview)}
        >
          <SectionStepContent step={step} isComplete={isComplete} />
        </div>
      ) : (
        <Link
          href={step.href}
          data-test={`demarche-etape-${step.key}`}
          className={sectionStepCardClassName(isActive, isPreview)}
        >
          <SectionStepContent step={step} isComplete={isComplete} />
        </Link>
      )}
    </div>
  );
};

const STEPS: {
  label: string;
  description: string;
  info?: string;
}[] = [
  {
    label: appLabels.demarchePcaetAvanceEtapeElaborationLabel,
    description: appLabels.demarchePcaetAvanceEtapeElaborationDescription,
  },
  {
    label: appLabels.demarchePcaetAvanceEtapeTransmisLabel,
    description: appLabels.demarchePcaetAvanceEtapeTransmisDescription,
    info: appLabels.demarchePcaetAvanceEtapeTransmisInfo,
  },
  {
    label: appLabels.demarchePcaetAvanceEtapeAdopteLabel,
    description: appLabels.demarchePcaetAvanceEtapeAdopteDescription,
  },
  {
    label: appLabels.demarchePcaetAvanceEtapeArchiveLabel,
    description: appLabels.demarchePcaetAvanceEtapeArchiveDescription,
  },
];

function getActiveStepIndex(statut: DemarchePcaetStatut): number {
  switch (statut) {
    case DemarchePcaetStatusEnum.EN_ELABORATION:
      return 0;
    case DemarchePcaetStatusEnum.TRANSMIS_POUR_AVIS:
      return 1;
    case DemarchePcaetStatusEnum.ADOPTE:
      return 2;
    case DemarchePcaetStatusEnum.ARCHIVE:
      return 3;
    default:
      return 0;
  }
}

const NumberedStep = ({
  step,
  number,
  isDone,
  isPast = false,
  showConnector,
  connectorActive,
  children,
}: {
  step: (typeof STEPS)[number];
  number: number;
  isDone: boolean;
  isPast?: boolean;
  showConnector: boolean;
  connectorActive: boolean;
  children?: ReactNode;
}) => (
  <div
    className={['flex gap-5 transition-opacity', isPast && 'opacity-50']
      .filter(Boolean)
      .join(' ')}
    style={{ minHeight: showConnector ? '88px' : undefined }}
  >
    <div className="flex flex-col items-center w-8 shrink-0">
      <div
        className={[
          'flex items-center justify-center rounded-full w-8 h-8 shrink-0 border-2 font-bold text-sm',
          isDone
            ? 'bg-primary-7 border-primary-7 text-white'
            : 'bg-white border-grey-3 text-grey-10',
        ].join(' ')}
      >
        {number}
      </div>
      {showConnector && (
        <div
          className={`flex-1 min-h-px w-0.5 ${
            connectorActive ? 'bg-primary-7' : 'bg-grey-3'
          }`}
        />
      )}
    </div>

    <div className="flex flex-col gap-1 pt-1 pb-5 flex-1 min-w-0 text-sm">
      <div className="flex items-center gap-1 flex-wrap">
        <span className="font-medium text-base text-primary-9">
          {step.label}
        </span>
        {step.info && (
          <InfoTooltip label={step.info} activatedBy="hover" size="xs" />
        )}
      </div>
      <span
        className={`leading-relaxed ${
          isDone ? 'text-primary-11' : 'text-grey-6'
        }`}
      >
        {step.description}
      </span>
      {children}
    </div>
  </div>
);

type Props = {
  collectiviteId: number;
  demarcheId?: number;
  statut: DemarchePcaet['statut'];
  completion: DemarchePcaetCompletion;
  activeSection?: DemarchePcaetSectionKey | null;
  /** Échéance de remise des avis (calculée par le serveur à la transmission). */
  avisDeadlineAt?: string | null;
  canTransmettre?: boolean;
  onTransmettre?: () => void;
  canReprendre?: boolean;
  onReprendre?: () => void;
  isPublished?: boolean;
  canPublish?: boolean;
  onPublish?: () => void;
  onUnpublish?: () => void;
  /** Affiche le stepper sans liens ni actions (page de création). */
  isPreview?: boolean;
};

export const AvanceDemarcheSection = ({
  collectiviteId,
  demarcheId = 0,
  statut,
  completion,
  activeSection = null,
  avisDeadlineAt,
  canTransmettre,
  onTransmettre,
  canReprendre,
  onReprendre,
  isPublished,
  canPublish,
  onPublish,
  onUnpublish,
  isPreview = false,
}: Props) => {
  const activeIndex = getActiveStepIndex(statut);

  const sectionSteps: SectionStep[] = [
    {
      key: 'documents',
      label: appLabels.demarchePcaetDetailDocumentsTitre,
      description: appLabels.demarchePcaetAvanceSectionDocumentsDescription,
      status: completion.documents,
      href: makeCollectiviteDemarchePcaetRootUrl({
        collectiviteId,
        demarchePcaetId: demarcheId,
      }),
    },
    {
      key: 'diagnostic',
      label: appLabels.demarchePcaetDiagnosticTitre,
      description: appLabels.demarchePcaetAvanceSectionDiagnosticDescription,
      status: completion.diagnostic,
      href: makeCollectiviteDemarchePcaetDiagnosticUrl({
        collectiviteId,
        demarchePcaetId: demarcheId,
      }),
    },
    {
      key: 'plan',
      label: appLabels.demarchePcaetProgrammeTitre,
      description: appLabels.demarchePcaetAvanceSectionPlanDescription,
      status: completion.plan,
      href: makeCollectiviteDemarchePcaetPlanActionsUrl({
        collectiviteId,
        demarchePcaetId: demarcheId,
      }),
    },
  ];

  const [elaborationStep, ...remainingSteps] = STEPS;
  const isElaborationActive = !isPreview && activeIndex === 0;

  return (
    <div className="flex flex-col">
      {/* Étape 0 : création de la démarche */}
      <NumberedStep
        step={{
          label: appLabels.demarchePcaetAvanceEtapeCreationLabel,
          description: appLabels.demarchePcaetAvanceEtapeCreationDescription,
        }}
        number={0}
        isDone
        isPast={!isPreview}
        showConnector
        connectorActive={!isPreview}
      />

      {/* Étape 1 : en cours de dépôt */}
      <NumberedStep
        step={elaborationStep}
        number={1}
        isDone={!isPreview && activeIndex >= 0}
        isPast={!isPreview && activeIndex > 0}
        showConnector
        connectorActive={activeIndex > 0}
      />

      {/* Sous-actions de l'étape 1 : documents, diagnostic, plan */}
      {isElaborationActive && (
        <div className="flex gap-5">
          <div className="flex flex-col items-center w-8 shrink-0">
            <div className="flex-1 min-h-px w-0.5 bg-grey-3" />
          </div>
          <div className="flex-1 min-w-0 pb-5">
            {sectionSteps.map((step) => (
              <SectionStepRow
                key={step.key}
                step={step}
                isActive={step.key === activeSection}
                isPreview={isPreview}
              />
            ))}

            {/* Transmission du dépôt aux instances consultatives */}
            <Tooltip
              label={
                !canTransmettre
                  ? appLabels.demarchePcaetAvanceValiderTooltip
                  : undefined
              }
              activatedBy="hover"
            >
              <span className="block w-full">
                <Button
                  className="w-full justify-center"
                  variant={canTransmettre ? 'primary' : 'grey'}
                  size="sm"
                  icon="arrow-right-line"
                  iconPosition="right"
                  onClick={onTransmettre}
                  disabled={!canTransmettre}
                >
                  {appLabels.demarchePcaetAvanceValiderDepot}
                </Button>
              </span>
            </Tooltip>
          </div>
        </div>
      )}

      {/* Étapes suivantes : transmis pour avis, adopté... */}
      {remainingSteps.map((step, i) => {
        const index = i + 1;
        const isDone = index <= activeIndex;
        const isPast = index < activeIndex;
        const isLast = index === STEPS.length - 1;
        const showNouvelleAction = index === activeIndex && index >= 2;

        return (
          <NumberedStep
            key={step.label}
            step={step}
            number={index + 1}
            isDone={isDone}
            isPast={isPast}
            showConnector={!isLast}
            connectorActive={index < activeIndex}
          >
            {index === 1 &&
              statut === DemarchePcaetStatusEnum.TRANSMIS_POUR_AVIS &&
              avisDeadlineAt && (
                <TransmisDeadline avisDeadlineAt={avisDeadlineAt} />
              )}
            {index === 1 &&
              statut === DemarchePcaetStatusEnum.TRANSMIS_POUR_AVIS &&
              !isPreview &&
              canReprendre !== false && (
                <div className="mt-2">
                  <Button
                    variant="grey"
                    size="xs"
                    icon="arrow-left-line"
                    onClick={onReprendre}
                  >
                    {appLabels.demarchePcaetTransitionReprendre}
                  </Button>
                </div>
              )}
            {index === 2 &&
              canPublish &&
              !isPreview &&
              (isPublished ? (
                <div className="mt-2">
                  <Button
                    variant="grey"
                    size="xs"
                    icon="eye-off-line"
                    onClick={onUnpublish}
                  >
                    {appLabels.demarchePcaetTransitionDepublier}
                  </Button>
                </div>
              ) : (
                <div className="mt-2">
                  <Button
                    variant="primary"
                    size="xs"
                    icon="eye-line"
                    onClick={onPublish}
                  >
                    {appLabels.demarchePcaetTransitionPublier}
                  </Button>
                </div>
              ))}
            {showNouvelleAction && (
              <div className="mt-2 -ml-[52px] flex items-center gap-2">
                <div className="w-8 flex justify-center">
                  <div className="bg-grey-3 h-px w-3" />
                </div>
                <Link
                  href={makeCollectiviteDemarchePcaetNouveauUrl({
                    collectiviteId,
                  })}
                >
                  <Button variant="primary" size="xs" icon="add-line">
                    {appLabels.demarchePcaetAvanceNouvelleDemarche}
                  </Button>
                </Link>
              </div>
            )}
          </NumberedStep>
        );
      })}
    </div>
  );
};
