'use client';

import { PropsWithChildren } from 'react';
import type { DemarchePcaetCompletion } from '../demarche-pcaet-completion';
import type { DemarchePcaetUpdatePatch } from '../demarche-pcaet.storage';
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
  onDemarcheChange: (demarche: DemarchePcaet) => void;
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
  onDemarcheChange,
  onPublish,
  onUnpublish,
  children,
}: Props) => {
  const isPublished = demarche.statutPublication === 'publie';

  const { isOpen, toggle } = usePcaetAvanceSidePanel({
    collectiviteId,
    demarcheId: demarche.id,
    statut: demarche.statut,
    completion,
    activeSection,
    dateTransmis: demarche.dateModification,
    isPublished,
    canPublish: completion.canPublish,
    onPublish,
    onUnpublish,
  });

  return (
    <PcaetDetailLayout.Root>
      <DrealContextBanner />
      <PcaetDetailLayout.Header>
        <DemarchePcaetHeader
          demarche={demarche}
          collectiviteId={collectiviteId}
          onDemarcheChange={onDemarcheChange}
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
