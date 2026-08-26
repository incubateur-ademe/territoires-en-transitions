'use client';

import { appLabels } from '@/app/labels/catalog';
import { type DemarchePcaetTransitionEvaluation } from '@tet/domain/demarches';
import { Button, Tooltip } from '@tet/ui';
import type { DemarchePcaetCompletion } from '../completion';
import { useDemarchePcaetDiagnostic } from '../pcaet/diagnostic/data/use-diagnostic';
import {
  serializeTopicParam,
  useDemarcheTopicParam,
} from '../pcaet/diagnostic/use-topic-param';
import {
  getStepsNavModel,
  makeDemarcheSectionUrl,
  type DemarcheParcoursEtape,
  type DemarcheSectionKey,
  type DemarcheStepItem,
} from '../steps';
import { getTransitionBlocageLabel } from '../transitions';
import type { DemarchePcaet } from '../types';

/**
 * L'acte qui clôt le temps parcouru, proposé à la place d'« Étape suivante » sur
 * le dernier item : la transmission pour avis à l'amont, la validation du dépôt
 * final à l'aval. `null` quand il n'y a plus rien à valider — un dossier déjà
 * publié garde son parcours, mais sa dernière étape ne mène plus nulle part.
 */
type FinalAction = {
  /** État serveur de la transition : arme le bouton et explique son blocage. */
  transition: DemarchePcaetTransitionEvaluation;
  label: string;
  dataTest: string;
  onClick: () => void;
};

type Props = {
  demarche: DemarchePcaet;
  collectiviteId: number;
  completion: DemarchePcaetCompletion;
  activeSection: DemarcheSectionKey;
  etape: DemarcheParcoursEtape;
  finalAction: FinalAction | null;
  /** Ouvre le panneau « Étapes » quand on franchit une sous-étape. */
  onOpenProgressPanel: () => void;
};

/**
 * Barre « Étape précédente | Étape suivante » d'un temps du dossier : traverse
 * ses sous-étapes dans l'ordre, puis propose l'acte qui le clôt sur le dernier
 * item. Le parcours et cet acte diffèrent d'un temps à l'autre, la barre non.
 */
export const DemarcheStepsNav = ({
  demarche,
  collectiviteId,
  completion,
  activeSection,
  etape,
  finalAction,
  onOpenProgressPanel,
}: Props) => {
  const { topics } = useDemarchePcaetDiagnostic(demarche.id);
  const [topicParam] = useDemarcheTopicParam();

  const { prev, next, isLastStep } = getStepsNavModel({
    etape,
    activeSection,
    hasDocuments:
      etape === 'aval'
        ? completion.documentsAval !== null
        : completion.documents !== null,
    topicCodes: topics.map((topic) => topic.code),
    currentTopicCode: topicParam,
  });

  // Le dernier item n'a pas de « suivant » : il n'a que son acte de clôture,
  // et sans lui la barre n'y garde que le retour en arrière.
  const showFinalAction = isLastStep && finalAction !== null;
  if (!prev && !next && !showFinalAction) return null;

  const ids = { collectiviteId, demarcheId: demarche.id };
  const hrefOf = (item: DemarcheStepItem) =>
    item.section === 'diagnostic' && item.topicCode
      ? serializeTopicParam(makeDemarcheSectionUrl('diagnostic', ids), {
          topic: item.topicCode,
        })
      : makeDemarcheSectionUrl(item.section, ids);
  const crossesSection = (item: DemarcheStepItem) =>
    item.section !== activeSection;

  return (
    <nav
      aria-label={appLabels.demarcheStepsNavAriaLabel}
      data-test="demarches.steps-nav"
      // Sticky bottom : flotte au bas du viewport par-dessus le contenu tant
      // que sa position naturelle est sous la ligne de flottaison, puis
      // reprend sa place dans le flux en fin de page.
      className="sticky bottom-0 z-10 flex w-full items-center gap-4 border-t border-primary-3 bg-grey-2 py-4 shadow-t-sm"
    >
      {prev && (
        <Button
          dataTest="demarches.steps-nav.previous"
          variant="outlined"
          size="sm"
          icon="arrow-left-line"
          iconPosition="left"
          href={hrefOf(prev)}
          onClick={crossesSection(prev) ? onOpenProgressPanel : undefined}
        >
          {appLabels.demarcheStepsNavPrevious}
        </Button>
      )}

      {showFinalAction && finalAction ? (
        <Tooltip
          label={getTransitionBlocageLabel(finalAction.transition)}
          activatedBy="hover"
        >
          <span className="block ml-auto">
            <Button
              dataTest={finalAction.dataTest}
              variant={finalAction.transition.enabled ? 'primary' : 'grey'}
              size="sm"
              icon="arrow-right-line"
              iconPosition="right"
              disabled={!finalAction.transition.enabled}
              onClick={() => {
                onOpenProgressPanel();
                finalAction.onClick();
              }}
            >
              {finalAction.label}
            </Button>
          </span>
        </Tooltip>
      ) : (
        next && (
          <Button
            dataTest="demarches.steps-nav.next"
            className="ml-auto"
            variant="primary"
            size="sm"
            icon="arrow-right-line"
            iconPosition="right"
            href={hrefOf(next)}
            onClick={crossesSection(next) ? onOpenProgressPanel : undefined}
          >
            {appLabels.demarcheStepsNavNext}
          </Button>
        )
      )}
    </nav>
  );
};
