import { makeCollectiviteDemarchePcaetNouveauUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { Button, Icon, Tooltip } from '@tet/ui';
import Link from 'next/link';
import type {
  DemarchePcaet,
  DemarchePcaetStatut,
} from '../demarche-pcaet.types';
import { DemarchePcaetSection } from './demarche-pcaet-section';

const STEPS: { label: string; description: string; info?: string }[] = [
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
      return 2;
    case 'publie':
      return 3;
    default:
      return 0;
  }
}

type Props = {
  collectiviteId: number;
  statut: DemarchePcaet['statut'];
  isPublished?: boolean;
  canPublish?: boolean;
  onPublish?: () => void;
  onUnpublish?: () => void;
};

export const AvanceDemarcheSection = ({
  collectiviteId,
  statut,
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
                {!isLast && <div className={`flex-1 min-h-px w-0.5 ${index < activeIndex ? 'bg-primary-7' : 'bg-grey-3'}`} />}
              </div>

              <div className="flex flex-col gap-1 pt-1 pb-5 flex-1 min-w-0 text-sm">
                <div className="flex items-center gap-1">
                  <span className="font-medium text-primary-9">
                    {step.label}
                  </span>
                  {step.info && (
                    <Tooltip label={step.info} activatedBy="hover">
                      <span className="cursor-help">
                        <Icon
                          icon="information-line"
                          size="xs"
                          className="text-grey-6"
                        />
                      </span>
                    </Tooltip>
                  )}
                </div>
                <span className={`leading-relaxed ${isDone ? 'text-primary-11' : 'text-grey-6'}`}>
                  {step.description}
                </span>
                {showNouvelleAction && (
                  <div className="mt-2 -ml-[52px] flex items-center gap-2">
                    <div className="w-8 flex justify-center">
                      <div className="bg-grey-3 h-px w-3" />
                    </div>
                    <Link
                      href={makeCollectiviteDemarchePcaetNouveauUrl({ collectiviteId })}
                    >
                      <Button
                        variant="primary"
                        size="xs"
                        icon="add-line"
                      >
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
