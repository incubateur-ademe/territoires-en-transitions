'use client';

import { appLabels } from '@/app/labels/catalog';
import {
  DemarchePcaetStatusEnum,
  type DemarchePcaetTransitionEvaluation,
} from '@tet/domain/demarches';
import { getTransitionBlocageLabel } from '../transitions';
import { Button, Tooltip } from '@tet/ui';
import { useSearchParams } from 'next/navigation';
import type { DemarchePcaetCompletion } from '../completion';
import { useDemarchePcaetDiagnostic } from '../pcaet/diagnostic/data/use-diagnostic';
import {
  serializeTopicParam,
  useDemarcheTopicParam,
} from '../pcaet/diagnostic/use-topic-param';
import { DREAL_INSTRUCTEUR_PARAM } from '../pcaet/vue-dreal/components/dreal-context-banner';
import {
  getStepsNavModel,
  makeDemarcheSectionUrl,
  type DemarcheSectionKey,
  type DemarcheStepItem,
} from '../steps';
import type { DemarchePcaet } from '../types';

type Props = {
  demarche: DemarchePcaet;
  collectiviteId: number;
  completion: DemarchePcaetCompletion;
  activeSection: DemarcheSectionKey;
  /** État serveur de la transmission : arme le bouton et explique son blocage. */
  transmettre: DemarchePcaetTransitionEvaluation;
  onTransmettre: () => void;
  /** Ouvre le panneau « Étapes » quand on franchit une sous-étape. */
  onOpenProgressPanel: () => void;
};

/**
 * Barre « Étape précédente | Étape suivante » du parcours d'élaboration :
 * traverse documents → topics du diagnostic → plan, puis propose la
 * transmission pour avis sur le dernier item.
 */
export const DemarcheStepsNav = ({
  demarche,
  collectiviteId,
  completion,
  activeSection,
  transmettre,
  onTransmettre,
  onOpenProgressPanel,
}: Props) => {
  const searchParams = useSearchParams();
  const { topics } = useDemarchePcaetDiagnostic(demarche.id);
  const [topicParam] = useDemarcheTopicParam();

  // Le parcours n'existe que pendant l'élaboration ; l'instructeur DREAL
  // consulte en lecture seule, sans navigation d'édition.
  if (demarche.statut !== DemarchePcaetStatusEnum.EN_ELABORATION) return null;
  if (searchParams.get(DREAL_INSTRUCTEUR_PARAM) === '1') return null;

  const { prev, next, isLastStep } = getStepsNavModel({
    activeSection,
    hasDocuments: completion.documents !== null,
    topicCodes: topics.map((topic) => topic.code),
    currentTopicCode: topicParam,
  });

  if (!prev && !next && !isLastStep) return null;

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

      {isLastStep ? (
        <Tooltip
          label={getTransitionBlocageLabel(transmettre)}
          activatedBy="hover"
        >
          <span className="block ml-auto">
            <Button
              dataTest="demarches.steps-nav.transmettre"
              variant={transmettre.enabled ? 'primary' : 'grey'}
              size="sm"
              icon="arrow-right-line"
              iconPosition="right"
              disabled={!transmettre.enabled}
              onClick={() => {
                onOpenProgressPanel();
                onTransmettre();
              }}
            >
              {appLabels.demarcheAvanceValiderDepot}
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
