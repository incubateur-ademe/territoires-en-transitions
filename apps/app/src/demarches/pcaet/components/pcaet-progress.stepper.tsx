import {
  makeCollectiviteDemarchePcaetDiagnosticUrl,
  makeCollectiviteDemarchePcaetNouveauUrl,
  makeCollectiviteDemarchePcaetPlanActionsUrl,
  makeCollectiviteDemarchePcaetRootUrl,
} from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { Button, Icon, InfoTooltip, Tooltip } from '@tet/ui';
import Link from 'next/link';
import type { ReactNode } from 'react';
import type { DemarchePcaetCompletion } from '../demarche-pcaet-completion';
import type {
  DemarchePcaet,
  DemarchePcaetStatut,
  DemarchePcaetVoletStatut,
} from '../demarche-pcaet.types';
import { DemarchePcaetSection } from './demarche-pcaet-section';

export type DemarchePcaetSectionKey = 'documents' | 'diagnostic' | 'plan';

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function diffDays(from: Date, to: Date): number {
  return Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

function TransmisDeadline({ dateTransmis }: { dateTransmis: string }) {
  const transmisDate = new Date(dateTransmis);
  const deadline = addMonths(transmisDate, 3);
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
          ? 'bg-error-1/10 text-error-1 border border-error-1/30'
          : isPending
          ? 'bg-warning-1/10 text-warning-2 border border-warning-1/30'
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
            ? 'text-warning-2'
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
    'flex flex-col gap-1 rounded-lg border p-3 text-sm transition-colors',
    isActive ? 'border-primary-4 bg-primary-0' : 'border-grey-3 bg-white',
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
    <div className="flex items-center justify-between gap-2">
      <span className="font-medium text-primary-9">{step.label}</span>
      <span
        className={[
          'shrink-0 text-[10px] font-semibold uppercase tracking-wide rounded px-1.5 py-0.5 border',
          isComplete
            ? 'bg-success-2 text-success-9 border-success-3'
            : 'bg-warning-1 text-warning-2 border-warning-1',
        ].join(' ')}
      >
        {isComplete
          ? appLabels.demarchePcaetAvanceSectionComplete
          : appLabels.demarchePcaetAvanceSectionIncomplete}
      </span>
    </div>
    <span className="leading-relaxed text-grey-7">{step.description}</span>
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
    <div className="flex gap-5" style={{ minHeight: '88px' }}>
      <div className="flex flex-col items-center w-8 shrink-0">
        <div
          className={[
            'flex items-center justify-center rounded-full w-8 h-8 shrink-0 border-2',
            isComplete
              ? 'bg-success border-success text-white'
              : 'bg-white border-warning-1 text-warning-1',
          ].join(' ')}
        >
          <Icon icon={isComplete ? 'check-line' : 'close-line'} size="sm" />
        </div>
        <div className="flex-1 min-h-px w-0.5 bg-grey-3" />
      </div>

      <div className="pt-0.5 pb-5 flex-1 min-w-0">
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
    </div>
  );
};

const RAIL_CENTER = 16;
const SUB_ACTION_INDENT = 24;
const RAIL_CURVE_HEIGHT = 24;

const RailCurve = ({ direction }: { direction: 'enter' | 'exit' }) => {
  const half = RAIL_CURVE_HEIGHT / 2;
  const indentedCenter = RAIL_CENTER + SUB_ACTION_INDENT;
  const width = indentedCenter + RAIL_CENTER;
  const path =
    direction === 'enter'
      ? `M ${RAIL_CENTER} 0 C ${RAIL_CENTER} ${half}, ${indentedCenter} ${half}, ${indentedCenter} ${RAIL_CURVE_HEIGHT}`
      : `M ${indentedCenter} 0 C ${indentedCenter} ${half}, ${RAIL_CENTER} ${half}, ${RAIL_CENTER} ${RAIL_CURVE_HEIGHT}`;

  return (
    <svg
      width={width}
      height={RAIL_CURVE_HEIGHT}
      viewBox={`0 0 ${width} ${RAIL_CURVE_HEIGHT}`}
      className="text-grey-3"
      aria-hidden
    >
      <path d={path} fill="none" stroke="currentColor" strokeWidth={2} />
    </svg>
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
    case 'brouillon':
    case 'en_elaboration':
    case 'pret_pour_depot':
      return 0;
    case 'soumis_ademe':
    case 'en_verification':
      return 1;
    case 'valide':
    case 'publie':
      return 2;
    case 'evaluation_mi_parcours':
      return 3;
    case 'evaluation_finale':
      return 4;
    default:
      return 0;
  }
}

const TRANSMIS_STATUTS: DemarchePcaetStatut[] = [
  'soumis_ademe',
  'en_verification',
];

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
        <span className="font-medium text-primary-9">{step.label}</span>
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
  demarcheId?: string;
  statut: DemarchePcaet['statut'];
  completion: DemarchePcaetCompletion;
  activeSection?: DemarchePcaetSectionKey | null;
  dateTransmis?: string | null;
  isPublished?: boolean;
  canPublish?: boolean;
  onPublish?: () => void;
  onUnpublish?: () => void;
  /** Affiche le stepper sans liens ni actions de publication (page de création). */
  isPreview?: boolean;
  /** Masque le titre de section (déjà porté par le SidePanel). */
  hideTitle?: boolean;
};

export const AvanceDemarcheSection = ({
  collectiviteId,
  demarcheId = '',
  statut,
  completion,
  activeSection = null,
  dateTransmis,
  isPublished,
  canPublish,
  onPublish,
  onUnpublish,
  isPreview = false,
  hideTitle = false,
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
    <DemarchePcaetSection
      title={hideTitle ? undefined : appLabels.demarchePcaetAvanceTitre}
    >
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
          <>
            <RailCurve direction="enter" />
            <div style={{ paddingLeft: SUB_ACTION_INDENT }}>
              {sectionSteps.map((step) => (
                <SectionStepRow
                  key={step.key}
                  step={step}
                  isActive={step.key === activeSection}
                  isPreview={isPreview}
                />
              ))}
            </div>
            <RailCurve direction="exit" />

            {/* Bouton de validation du dépôt */}
            <div className="flex gap-5">
              <div className="flex flex-col items-center w-8 shrink-0">
                <div className="flex-1 min-h-px w-0.5 bg-grey-3" />
              </div>
              <div className="pb-5 flex-1 min-w-0">
                {isPublished ? (
                  <Button
                    variant="grey"
                    size="xs"
                    icon="arrow-left-line"
                    onClick={onUnpublish}
                  >
                    {appLabels.demarchePcaetAvanceRepasserBrouillon}
                  </Button>
                ) : (
                  <Tooltip
                    label={
                      !canPublish
                        ? appLabels.demarchePcaetAvanceValiderTooltip
                        : undefined
                    }
                    activatedBy="hover"
                  >
                    <span>
                      <Button
                        variant="primary"
                        size="xs"
                        icon="arrow-right-line"
                        iconPosition="right"
                        onClick={onPublish}
                        disabled={!canPublish}
                      >
                        {appLabels.demarchePcaetAvanceValiderDepot}
                      </Button>
                    </span>
                  </Tooltip>
                )}
              </div>
            </div>
          </>
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
                TRANSMIS_STATUTS.includes(statut) &&
                dateTransmis && (
                  <TransmisDeadline dateTransmis={dateTransmis} />
                )}
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
    </DemarchePcaetSection>
  );
};
