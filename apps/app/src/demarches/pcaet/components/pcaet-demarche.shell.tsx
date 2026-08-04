'use client';

import {
  canPublishDemarchePcaetStatus,
  DemarchePcaetPublicationStatusEnum,
  DemarchePcaetTransitionEnum,
} from '@tet/domain/demarches';
import { PropsWithChildren } from 'react';
import type { DemarchePcaetCompletion } from '../demarche-pcaet-completion';
import type { DemarchePcaetUpdatePatch } from '../demarche-pcaet.types';
import type { DemarchePcaet } from '../demarche-pcaet.types';
import { DrealContextBanner } from '../vue-dreal/components/dreal-context-banner';
import { DemarchePcaetHeader } from './header';
import { PcaetAvanceSidePanelButton } from './pcaet-avance.side-panel-button';
import { PcaetDetailLayout } from './pcaet-detail-layout';
import type { DemarchePcaetSectionKey } from './pcaet-progress.stepper';
import { usePcaetAvanceSidePanel } from './use-pcaet-avance-side-panel';

type Props = PropsWithChildren<{
  demarche: DemarchePcaet;
  collectiviteId: number;
  completion: DemarchePcaetCompletion;
  activeSection: DemarchePcaetSectionKey;
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
export const PcaetDemarcheShell = ({
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

  const { isOpen, toggle } = usePcaetAvanceSidePanel({
    collectiviteId,
    demarcheId: demarche.id,
    statut: demarche.statut,
    completion,
    activeSection,
    avisDeadlineAt: demarche.dateEcheanceAvis,
    // Les guards (pilote, délais…) sont évalués côté serveur : le front lit
    // simplement les transitions applicables retournées par l'API.
    canTransmettre:
      completion.canTransmettre &&
      demarche.availableTransitions.includes(
        DemarchePcaetTransitionEnum.TRANSMETTRE_POUR_AVIS
      ),
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
    <PcaetDetailLayout.Root>
      <DrealContextBanner />
      <PcaetDetailLayout.Header>
        <DemarchePcaetHeader
          demarche={demarche}
          onUpdate={onUpdate}
          sidePanelAction={
            <PcaetAvanceSidePanelButton isOpen={isOpen} onClick={toggle} />
          }
        />
      </PcaetDetailLayout.Header>

      <PcaetDetailLayout.Container>
        <PcaetDetailLayout.Main>{children}</PcaetDetailLayout.Main>
      </PcaetDetailLayout.Container>
    </PcaetDetailLayout.Root>
  );
};
