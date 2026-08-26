'use client';

import { isPublieDemarchePcaetStatus } from '@tet/domain/demarches';
import { PropsWithChildren } from 'react';
import type { DemarchePcaetCompletion } from '../completion';
import { DemarchePcaetHeader } from '../pcaet/components/header';
import type { DemarcheSectionKey } from '../steps';
import type { DemarchePcaet, DemarchePcaetUpdatePatch } from '../types';
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
  const isPublished = isPublieDemarchePcaetStatus(demarche.statut);

  // Les guards (pilote, complétude, délais…) sont évalués côté serveur : le
  // front lit l'état des transitions, il ne le recompose pas.
  const { isOpen, toggle, open } = useDemarcheAvanceSidePanel(
    {
      demarcheType: demarche.type,
      collectiviteId,
      demarcheId: demarche.id,
      statut: demarche.statut,
      completion,
      activeSection,
      avisDeadlineAt: demarche.dateEcheanceAvis,
      transitions: demarche.transitions,
      onTransmettre,
      onReprendre,
      isPublished,
      onPublish,
      onUnpublish,
    },
    { defaultOpen: true }
  );

  return (
    <DemarcheDetailLayout.Root>
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
        {/* La barre d'étapes déroule le parcours d'élaboration : documents,
            topics du diagnostic, plan, puis la transmission. À l'aval, ce
            parcours est derrière nous et il n'y a qu'un écran — proposer une
            « étape suivante » n'y mènerait nulle part. */}
        {!demarche.avalModifiable && (
          <DemarcheStepsNav
            demarche={demarche}
            collectiviteId={collectiviteId}
            completion={completion}
            activeSection={activeSection}
            transmettre={demarche.transitions.transmettre_pour_avis}
            onTransmettre={onTransmettre}
            onOpenProgressPanel={open}
          />
        )}
      </DemarcheDetailLayout.Container>
    </DemarcheDetailLayout.Root>
  );
};
