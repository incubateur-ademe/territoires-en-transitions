import { makeCollectiviteDemarchePcaetNouveauUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { Button, InfoTooltip, Tooltip } from '@tet/ui';
import Link from 'next/link';
import type {
  DemarchePcaet,
  DemarchePcaetStatut,
} from '../demarche-pcaet.types';
import { DemarchePcaetSection } from './demarche-pcaet-section';

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

const STEPS: {
  label: string;
  description: string;
  info?: string;
  required?: boolean;
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
    label: appLabels.demarchePcaetAvanceEtapeEvalMiParcoursLabel,
    description: appLabels.demarchePcaetAvanceEtapeEvalMiParcoursDescription,
    required: true,
  },
  {
    label: appLabels.demarchePcaetAvanceEtapeEvalFinaleLabel,
    description: appLabels.demarchePcaetAvanceEtapeEvalFinaleDescription,
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

type Props = {
  collectiviteId: number;
  statut: DemarchePcaet['statut'];
  dateTransmis?: string | null;
  isPublished?: boolean;
  canPublish?: boolean;
  onPublish?: () => void;
  onUnpublish?: () => void;
};

export const AvanceDemarcheSection = ({
  collectiviteId,
  statut,
  dateTransmis,
  isPublished,
  canPublish,
  onPublish,
  onUnpublish,
}: Props) => {
  const activeIndex = getActiveStepIndex(statut);

  return (
    <DemarchePcaetSection title={appLabels.demarchePcaetAvanceTitre}>
      <div className="flex flex-col">
        {STEPS.map((step, index) => {
          const isDone = index <= activeIndex;
          const isLast = index === STEPS.length - 1;
          const showTransitionAction = index === 0 && !isLast;
          const showNouvelleAction = index === activeIndex && index >= 2;

          return (
            <div
              key={step.label}
              className="flex gap-5"
              style={{ minHeight: isLast ? undefined : '88px' }}
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
                  {index + 1}
                </div>
                {!isLast && (
                  <div
                    className={`flex-1 min-h-px w-0.5 ${
                      index < activeIndex ? 'bg-primary-7' : 'bg-grey-3'
                    }`}
                  />
                )}
              </div>

              <div className="flex flex-col gap-1 pt-1 pb-5 flex-1 min-w-0 text-sm">
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="font-medium text-primary-9">
                    {step.label}
                  </span>
                  {step.required && (
                    <span className="text-[10px] font-semibold uppercase tracking-wide bg-warning-1 text-warning-2 border border-warning-1 rounded px-1.5 py-0.5">
                      Obligatoire
                    </span>
                  )}
                  {step.info && (
                    <InfoTooltip
                      label={step.info}
                      activatedBy="hover"
                      size="xs"
                    />
                  )}
                </div>
                <span
                  className={`leading-relaxed ${
                    isDone ? 'text-primary-11' : 'text-grey-6'
                  }`}
                >
                  {step.description}
                </span>
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
                {showTransitionAction && (
                  <div className="mt-2 -ml-[52px] flex items-center gap-2">
                    <div className="w-8 flex justify-center">
                      <div className="bg-grey-3 h-px w-3" />
                    </div>
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
                )}
              </div>
            </div>
          );
        })}
      </div>
    </DemarchePcaetSection>
  );
};
