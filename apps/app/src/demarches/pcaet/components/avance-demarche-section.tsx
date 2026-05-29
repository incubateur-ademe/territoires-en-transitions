import { Button } from '@tet/ui';
import type {
  DemarchePcaet,
  DemarchePcaetStatut,
} from '../demarche-pcaet.types';
import { DemarchePcaetSection } from './demarche-pcaet-section';

const STEPS = [
  {
    label: 'Élaboration',
    description:
      "Rédaction du diagnostic, des objectifs et du programme d'actions par la collectivité.",
  },
  {
    label: 'Transmis pour avis',
    description:
      'Consultation des services déconcentrés (DREAL, Conseil régional, AE), délai de 3 mois.',
  },
  {
    label: 'Adopté',
    description:
      'PCAET en vigueur, pilotage des actions et indicateurs sur 6 ans.',
  },
  {
    label: 'Archivé',
    description:
      'Évaluation finale déposée, cycle clos, un nouveau peut être engagé.',
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
  statut: DemarchePcaet['statut'];
  isPublished?: boolean;
  onPublish?: () => void;
  onUnpublish?: () => void;
};

export const AvanceDemarcheSection = ({
  statut,
  isPublished,
  onPublish,
  onUnpublish,
}: Props) => {
  const activeIndex = getActiveStepIndex(statut);

  return (
    <DemarchePcaetSection title="Avancé de la démarche">
      <div className="flex flex-col">
        {STEPS.map((step, index) => {
          const isDone = index <= activeIndex;
          const isLast = index === STEPS.length - 1;
          // Action de transition entre l'étape 1 (Élaboration) et l'étape 2 (Transmis pour avis)
          const showTransitionAction = index === 0 && !isLast;

          return (
            <div
              key={step.label}
              className="flex gap-5"
              style={{ minHeight: isLast ? undefined : '88px' }}
            >
              {/* Colonne indicateur */}
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
                {!isLast && <div className="bg-grey-3 flex-1 min-h-px w-0.5" />}
              </div>

              {/* Contenu */}
              <div className="flex flex-col gap-1 pt-1 pb-5 flex-1 min-w-0 text-sm">
                <span className="font-medium text-primary-9">{step.label}</span>
                <span className="text-primary-11 leading-relaxed">
                  {step.description}
                </span>
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
                        Repasser en brouillon
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="xs"
                        icon="arrow-right-line"
                        iconPosition="right"
                        onClick={onPublish}
                      >
                        Valider le dépôt pour avis
                      </Button>
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
