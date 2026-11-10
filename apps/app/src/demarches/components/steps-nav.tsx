'use client';

import { appLabels } from '@/app/labels/catalog';
import { type DemarchePcaetTransitionEvaluation } from '@tet/domain/demarches';
import { Button, Event, Tooltip } from '@tet/ui';
import type { RefObject } from 'react';
import type { DemarchePcaetCompletion } from '../completion';
import { useCompleterEtapeDemo } from '../pcaet/demo/data/use-demo-mutations';
import { sweepRows } from '../pcaet/demo/sweep-rows';
import { useGetPcaetDiagnostic } from '../pcaet/diagnostic/data/use-get-pcaet-diagnostic';
import {
  serializePcaetDiagnosticTabQueryState,
  usePcaetDiagnosticTabQueryState,
} from '../pcaet/diagnostic/use-pcaet-diagnostic-tab-query-state';
import {
  getStepsNavModel,
  makeDemarcheSectionUrl,
  type DemarcheParcoursEtape,
  type DemarcheSectionKey,
  type DemarcheStepItem,
} from '../steps';
import { getTransitionBlocageLabel } from '../transitions';
import type { DemarchePcaet } from '../types';
import {
  toDemarcheTrackingSubject,
  useDemarcheTracker,
  useTrackDemarcheView,
} from '../use-demarche-tracker';

/**
 * L'acte qui clôt le temps parcouru, proposé à la place d'« Étape suivante » sur
 * le dernier item : la transmission pour avis à l'amont, la validation du dépôt
 * final à l'aval. `null` quand il n'y a plus rien à valider — un dossier déjà
 * publié garde son parcours, mais sa dernière étape ne mène plus nulle part.
 */
type FinalAction = {
  /** État serveur de la transition : arme le bouton et explique son blocage. */
  transition: DemarchePcaetTransitionEvaluation;
  transitionName: string;
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
  /** Contenu de la page, que le remplissage de démo balaie une fois écrit. */
  contentRef?: RefObject<HTMLDivElement | null>;
};

type DemoEtape = 'documents' | 'documentsAval' | 'diagnostic' | 'plan';

/** La sous-étape affichée, telle que le raccourci de démo la complète. */
const getDemoEtape = (
  activeSection: DemarcheSectionKey,
  etape: DemarcheParcoursEtape
): DemoEtape =>
  activeSection === 'documents'
    ? etape === 'aval'
      ? 'documentsAval'
      : 'documents'
    : activeSection;

/** Le raccourci n'écrit que là où le dossier accepte encore l'écriture. */
const isDemoEtapeModifiable = (
  demarche: DemarchePcaet,
  demoEtape: DemoEtape
): boolean =>
  demoEtape === 'documents'
    ? demarche.amontModifiable
    : demoEtape === 'documentsAval'
    ? demarche.avalModifiable
    : demarche.contenuModifiable;

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
  contentRef,
}: Props) => {
  const { tabs } = useGetPcaetDiagnostic(demarche.id);
  const completerEtape = useCompleterEtapeDemo();
  const [topicParam] = usePcaetDiagnosticTabQueryState();

  const { prev, next, isLastStep } = getStepsNavModel({
    etape,
    activeSection,
    hasDocuments:
      etape === 'aval'
        ? completion.documentsAval !== null
        : completion.documents !== null,
    topicCodes: tabs.map((tab) => tab.code),
    currentTopicCode: topicParam,
  });

  // Le dernier item n'a pas de « suivant » : il n'a que son acte de clôture,
  // et sans lui la barre n'y garde que le retour en arrière.
  const showFinalAction = isLastStep && finalAction !== null;

  const trackingSubject = toDemarcheTrackingSubject(demarche);
  const track = useDemarcheTracker(trackingSubject);
  const blockedBy = finalAction?.transition.blockedBy ?? [];
  useTrackDemarcheView(Event.demarches.pcaet.transitionBloqueeVue, {
    subject: trackingSubject,
    enabled: showFinalAction && !finalAction?.transition.enabled,
    key: `${demarche.id}:${finalAction?.transitionName}:${blockedBy.join(',')}`,
    properties: {
      transition: finalAction?.transitionName,
      blockedBy: blockedBy[0],
      blockedByAll: blockedBy,
    },
  });
  const trackNavigation = (direction: 'precedent' | 'suivant') =>
    track(Event.demarches.pcaet.navigation, {
      direction,
      section: activeSection,
    });

  // Mode démo : la saisie de l'étape affichée se remplit d'un clic, et les
  // vraies règles de complétude la passent au vert.
  const demoEtape = getDemoEtape(activeSection, etape);
  const showDemoCompleter =
    demarche.demo &&
    completion[demoEtape] === 'incomplete' &&
    isDemoEtapeModifiable(demarche, demoEtape);

  if (!prev && !next && !showFinalAction && !showDemoCompleter) return null;

  const ids = { collectiviteId, demarcheId: demarche.id };
  const hrefOf = (item: DemarcheStepItem) =>
    item.section === 'diagnostic' && item.topicCode
      ? serializePcaetDiagnosticTabQueryState(
          makeDemarcheSectionUrl('diagnostic', ids),
          {
            topic: item.topicCode,
          }
        )
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
          onClick={() => {
            trackNavigation('precedent');
            if (crossesSection(prev)) onOpenProgressPanel();
          }}
        >
          {appLabels.demarcheStepsNavPrevious}
        </Button>
      )}

      <div className="ml-auto flex items-center gap-4">
        {showDemoCompleter && (
          <Button
            dataTest="demarches.steps-nav.demo-completer"
            variant="outlined"
            size="sm"
            icon="magic-line"
            iconPosition="left"
            loading={completerEtape.isPending}
            disabled={completerEtape.isPending}
            onClick={() =>
              // Le balayage part une fois les données relues : l'invalidation
              // du hook est attendue avant ce rappel.
              completerEtape.mutate(
                { ...ids, etape: demoEtape },
                { onSuccess: () => sweepRows(contentRef?.current ?? null) }
              )
            }
          >
            {appLabels.demarcheDemoCompleterEtape}
          </Button>
        )}
        {showFinalAction && finalAction ? (
          <Tooltip
            label={getTransitionBlocageLabel(finalAction.transition)}
            activatedBy="hover"
          >
            <span className="block">
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
              variant="primary"
              size="sm"
              icon="arrow-right-line"
              iconPosition="right"
              href={hrefOf(next)}
              onClick={() => {
                trackNavigation('suivant');
                if (crossesSection(next)) onOpenProgressPanel();
              }}
            >
              {appLabels.demarcheStepsNavNext}
            </Button>
          )
        )}
      </div>
    </nav>
  );
};
