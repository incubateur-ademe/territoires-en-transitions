'use client';

import {
  canPublishDemarchePcaetStatus,
  DemarchePcaetPublicationStatusEnum,
  DemarchePcaetTransitionEnum,
} from '@tet/domain/demarches';
import { PropsWithChildren } from 'react';
import type { DemarchePcaetCompletion } from '../completion';
import type { DemarchePcaetUpdatePatch } from '../types';
import type { DemarchePcaet } from '../types';
import { DrealContextBanner } from '../pcaet/vue-dreal/components/dreal-context-banner';
import { DemarchePcaetHeader } from '../pcaet/components/header';
import type { DemarcheSectionKey } from '../steps';
import { DemarcheAvanceSidePanelButton } from './avance.side-panel-button';
import { DemarcheDetailLayout } from './detail.layout';
import { DemarcheStepsNav } from './steps-nav';
import { useDemarcheAvanceSidePanel } from './use-avance-side-panel';

type Props = PropsWithChildren<{
  demarche: DemarchePcaet;
  collectiviteId: number;
  completion: DemarchePcaetCompletion;
  activeSection: DemarcheSectionKey;
  onUpdate: (patch: DemarchePcaetUpdatePatch) => void;
  onTransmettre: () => void;
  onReprendre: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
}>;

/**
 * Coquille commune aux pages de sections de la démarche PCAET (documents,
 * diagnostic, plan d'actions) : en-tête, colonne principale, et avancée de
 * démarche dans le SidePanel global du layout.
 */
export const DemarcheShell = ({
  demarche,
  collectiviteId,
  completion,
  activeSection,
  onUpdate,
  onTransmettre,
  onReprendre,
  onPublish,
  onUnpublish,
  children,
}: Props) => {
  const isPublished =
    demarche.statutPublication === DemarchePcaetPublicationStatusEnum.PUBLISHED;

  // Les guards (pilote, délais…) sont évalués côté serveur : le front lit
  // simplement les transitions applicables retournées par l'API.
  const canTransmettre =
    completion.canTransmettre &&
    demarche.availableTransitions.includes(
      DemarchePcaetTransitionEnum.TRANSMETTRE_POUR_AVIS
    );

  const { isOpen, toggle, open } = useDemarcheAvanceSidePanel({
    demarcheType: demarche.type,
    collectiviteId,
    demarcheId: demarche.id,
    statut: demarche.statut,
    completion,
    activeSection,
    avisDeadlineAt: demarche.dateEcheanceAvis,
    canTransmettre,
    onTransmettre,
    canReprendre: demarche.availableTransitions.includes(
      DemarchePcaetTransitionEnum.REPRENDRE_ELABORATION
    ),
    onReprendre,
    isPublished,
    canPublish: canPublishDemarchePcaetStatus(demarche.statut),
    onPublish,
    onUnpublish,
  });

  return (
    <DemarcheDetailLayout.Root>
      <DrealContextBanner />
      <DemarcheDetailLayout.Header>
        <DemarchePcaetHeader
          demarche={demarche}
          onUpdate={onUpdate}
          sidePanelAction={
            <DemarcheAvanceSidePanelButton isOpen={isOpen} onClick={toggle} />
          }
        />
      </DemarcheDetailLayout.Header>

      <DemarcheDetailLayout.Container>
        <DemarcheDetailLayout.Main>{children}</DemarcheDetailLayout.Main>
        <DemarcheStepsNav
          demarche={demarche}
          collectiviteId={collectiviteId}
          completion={completion}
          activeSection={activeSection}
          canTransmettre={canTransmettre}
          onTransmettre={onTransmettre}
          onOpenProgressPanel={open}
        />
      </DemarcheDetailLayout.Container>
    </DemarcheDetailLayout.Root>
  );
};
