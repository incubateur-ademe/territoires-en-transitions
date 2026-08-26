import { makeCollectiviteDemarchePcaetNouveauUrl } from '@/app/app/paths';
import { makeDemarcheSectionUrl, type DemarcheSectionKey } from '../steps';
import { appLabels, type DemarcheTypeLabels } from '@/app/labels/catalog';
import {
  DemarchePcaetStatusEnum,
  getEtapeIndexDemarchePcaet,
  getIndexEtapeDemarchePcaet,
} from '@tet/domain/demarches';
import type {
  DemarcheType,
  DemarchePcaetTransitionEvaluations,
} from '@tet/domain/demarches';
import { getTransitionBlocageLabel } from '../transitions';
import { Button, Icon, InfoTooltip, Tooltip } from '@tet/ui';
import Link from 'next/link';
import type { ReactNode } from 'react';
import type { DemarchePcaetCompletion } from '../completion';
import { DemarcheCompletionBadge } from './completion.badge';

import type { DemarchePcaet, DemarchePcaetTopicStatut } from '../types';

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
        {appLabels.demarcheAvanceTransmisEcheance}
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
          ? appLabels.demarcheAvanceTransmisDepasse
          : `J\u2011${remaining}`}
      </span>
    </div>
  );
}

type SectionStep = {
  key: DemarcheSectionKey;
  label: string;
  description: string;
  status: DemarchePcaetTopicStatut;
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
        <DemarcheCompletionBadge
          className="shrink-0"
          statut={step.status}
          size="xs"
          withIcon={false}
          trim={false}
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
          data-test={`demarches.avance.etape-${step.key}`}
          className={sectionStepCardClassName(isActive, isPreview)}
        >
          <SectionStepContent step={step} isComplete={isComplete} />
        </div>
      ) : (
        <Link
          href={step.href}
          data-test={`demarches.avance.etape-${step.key}`}
          className={sectionStepCardClassName(isActive, isPreview)}
        >
          <SectionStepContent step={step} isComplete={isComplete} />
        </Link>
      )}
    </div>
  );
};

/**
 * Rang des étapes qui portent une action, lu dans le domaine : la position de
 * « finalisation » a déjà bougé une fois, et des index en dur l'avaient suivie
 * en silence.
 */
const ETAPE = {
  transmis: getIndexEtapeDemarchePcaet('transmis'),
  finalisation: getIndexEtapeDemarchePcaet('finalisation'),
  publie: getIndexEtapeDemarchePcaet('publie'),
} as const;

/** Les étapes du cycle de vie, libellées selon le type de démarche. */
const buildSteps = (
  type: DemarcheTypeLabels
): { label: string; description: string; info?: string }[] => [
  {
    label: appLabels.demarcheAvanceEtapeElaborationLabel,
    description: appLabels.demarcheAvanceEtapeElaborationDescription,
  },
  {
    label: appLabels.demarcheAvanceEtapeTransmisLabel,
    description: appLabels.demarcheAvanceEtapeTransmisDescription,
    info: appLabels.demarcheAvanceEtapeTransmisInfo,
  },
  {
    label: appLabels.demarcheAvanceEtapeFinalisationLabel,
    description: appLabels.demarcheAvanceEtapeFinalisationDescription,
  },
  {
    label: appLabels.demarcheAvanceEtapePublieLabel,
    description: appLabels.demarcheAvanceEtapePublieDescription({ type }),
  },
  {
    label: appLabels.demarcheAvanceEtapeArchiveLabel,
    description: appLabels.demarcheAvanceEtapeArchiveDescription,
  },
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
  step: ReturnType<typeof buildSteps>[number];
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
  /** Type de démarche : les libellés affichés en dépendent. */
  demarcheType: DemarcheType;
  collectiviteId: number;
  demarcheId?: number;
  statut: DemarchePcaet['statut'];
  completion: DemarchePcaetCompletion;
  activeSection?: DemarcheSectionKey | null;
  /** Échéance de remise des avis (calculée par le serveur à la transmission). */
  avisDeadlineAt?: string | null;
  /**
   * État serveur des transitions. Absent en preview (page de création) : les
   * actions s'affichent alors sans être armées par un dossier réel.
   */
  transitions?: DemarchePcaetTransitionEvaluations;
  onTransmettre?: () => void;
  onReprendre?: () => void;
  isPublished?: boolean;
  onPublish?: () => void;
  onUnpublish?: () => void;
  /** Affiche le stepper sans liens ni actions (page de création). */
  isPreview?: boolean;
};

export const AvanceDemarcheSection = ({
  collectiviteId,
  demarcheType,
  demarcheId = 0,
  statut,
  completion,
  activeSection = null,
  avisDeadlineAt,
  transitions,
  onTransmettre,
  onReprendre,
  isPublished,
  onPublish,
  onUnpublish,
  isPreview = false,
}: Props) => {
  const activeIndex = getEtapeIndexDemarchePcaet(statut);
  const transmettre = transitions?.transmettre_pour_avis;
  const publier = transitions?.publier;
  const typeLabels = appLabels.demarcheTypeLabels[demarcheType];

  const documentsUrl = makeDemarcheSectionUrl('documents', {
    collectiviteId,
    demarcheId,
  });

  // La sous-étape documents n'existe que si le modèle demande des pièces amont.
  const sectionSteps: SectionStep[] = [
    ...(completion.documents !== null
      ? [
          {
            key: 'documents' as const,
            label: appLabels.demarcheDetailDocumentsTitre,
            description: appLabels.demarcheAvanceSectionDocumentsDescription,
            status: completion.documents,
            href: documentsUrl,
          },
        ]
      : []),
    {
      key: 'diagnostic',
      label: appLabels.demarcheDiagnosticTitre,
      description: appLabels.demarcheAvanceSectionDiagnosticDescription({
        type: typeLabels,
      }),
      status: completion.diagnostic,
      href: makeDemarcheSectionUrl('diagnostic', {
        collectiviteId,
        demarcheId,
      }),
    },
    {
      key: 'plan',
      label: appLabels.demarcheProgrammeTitre,
      description: appLabels.demarcheAvanceSectionPlanDescription,
      status: completion.plan,
      href: makeDemarcheSectionUrl('plan', { collectiviteId, demarcheId }),
    },
  ];

  // Pièces produites après les avis (délibération d'adoption…), déposées dès la
  // finalisation ; leur couverture conditionne la publication.
  const documentsAvalStep: SectionStep | null =
    completion.documentsAval !== null
      ? {
          key: 'documents',
          label: appLabels.demarcheDetailAvisEtDocumentsTitre,
          description: appLabels.demarcheAvanceSectionDocumentsAvalDescription,
          status: completion.documentsAval,
          href: documentsUrl,
        }
      : null;

  // Le bloc de finalisation s'affiche dès que l'étape est atteinte ; l'état de
  // la transition n'arme que le bouton.
  const isFinalisationReached = activeIndex >= ETAPE.finalisation;

  const [elaborationStep, ...remainingSteps] = buildSteps(typeLabels);
  const isElaborationActive = !isPreview && activeIndex === 0;

  return (
    <div className="flex flex-col">
      {/* Étape 0 : création de la démarche */}
      <NumberedStep
        step={{
          label: appLabels.demarcheAvanceEtapeCreationLabel,
          description: appLabels.demarcheAvanceEtapeCreationDescription({
            type: typeLabels,
          }),
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
              label={getTransitionBlocageLabel(transmettre)}
              activatedBy="hover"
            >
              <span className="block w-full">
                <Button
                  className="w-full justify-center"
                  variant={transmettre?.enabled ? 'primary' : 'grey'}
                  size="sm"
                  icon="arrow-right-line"
                  iconPosition="right"
                  onClick={onTransmettre}
                  disabled={!transmettre?.enabled}
                >
                  {appLabels.demarcheAvanceValiderDepot}
                </Button>
              </span>
            </Tooltip>
          </div>
        </div>
      )}

      {/* Étapes suivantes : transmis pour avis, finalisation, publié... */}
      {remainingSteps.map((step, i) => {
        const index = i + 1;
        const isDone = index <= activeIndex;
        const isPast = index < activeIndex;
        const isLast = index === remainingSteps.length;
        // Un nouveau cycle ne peut démarrer qu'une fois le dossier publié.
        const showNouvelleAction =
          index === activeIndex && index >= ETAPE.publie;

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
            {index === ETAPE.transmis &&
              statut === DemarchePcaetStatusEnum.TRANSMIS_POUR_AVIS &&
              avisDeadlineAt && (
                <TransmisDeadline avisDeadlineAt={avisDeadlineAt} />
              )}
            {index === ETAPE.transmis &&
              statut === DemarchePcaetStatusEnum.TRANSMIS_POUR_AVIS &&
              !isPreview &&
              transitions?.reprendre_elaboration.enabled !== false && (
                <div className="mt-2">
                  <Button
                    variant="grey"
                    size="xs"
                    icon="arrow-left-line"
                    onClick={onReprendre}
                  >
                    {appLabels.demarcheTransitionReprendre}
                  </Button>
                </div>
              )}
            {index === ETAPE.finalisation &&
              isFinalisationReached &&
              !isPreview && (
                <div className="mt-3">
                  {/* Sous-étape aval : les pièces attendues après les avis */}
                  {documentsAvalStep && (
                    <SectionStepRow
                      step={documentsAvalStep}
                      isActive={
                        activeIndex === ETAPE.finalisation &&
                        documentsAvalStep.key === activeSection
                      }
                    />
                  )}
                  {/* Adoption et publication en un seul acte, mise en avant
                      comme la transmission pour avis. */}
                  {!isPublished && (
                    <Tooltip
                      label={getTransitionBlocageLabel(publier)}
                      activatedBy="hover"
                    >
                      <span className="block w-full">
                        <Button
                          className="w-full justify-center"
                          variant={publier?.enabled ? 'primary' : 'grey'}
                          size="sm"
                          icon="arrow-right-line"
                          iconPosition="right"
                          onClick={onPublish}
                          disabled={!publier?.enabled}
                        >
                          {appLabels.demarcheTransitionPublier}
                        </Button>
                      </span>
                    </Tooltip>
                  )}
                </div>
              )}
            {/* Dépublier part du dossier publié : l'action vit donc sur cette
                étape, et non sur la finalisation — qui, une fois le dossier
                public, est une étape passée et s'affiche estompée. */}
            {index === ETAPE.publie && isPublished && !isPreview && (
              <div className="mt-3">
                <Button
                  variant="grey"
                  size="xs"
                  icon="eye-off-line"
                  onClick={onUnpublish}
                >
                  {appLabels.demarcheTransitionDepublier}
                </Button>
              </div>
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
                    {appLabels.demarcheAvanceNouvelleDemarche}
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
