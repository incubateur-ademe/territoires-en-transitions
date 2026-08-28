'use client';

import { appLabels } from '@/app/labels/catalog';
import { isPublieDemarchePcaetStatus } from '@tet/domain/demarches';
import { PropsWithChildren, useState } from 'react';
import type { DemarchePcaetCompletion } from '../completion';
import { DemarchePcaetHeader } from '../pcaet/components/header';
import type { DemarcheSectionKey } from '../steps';
import type { DemarchePcaet, DemarchePcaetUpdatePatch } from '../types';
import { DemarcheAvanceSidePanelButton } from './avance.side-panel-button';
import { DemarcheDetailLayout } from './detail.layout';
import { DemarcheStepsNav } from './steps-nav';
import { TransmettrePourAvisModal } from './transmettre-pour-avis.modal';
import { useDemarcheAvanceSidePanel } from './use-avance-side-panel';

type Props = PropsWithChildren<{
  demarche: DemarchePcaet;
  collectiviteId: number;
  completion: DemarchePcaetCompletion;
  activeSection: DemarcheSectionKey;
  onUpdate: (patch: DemarchePcaetUpdatePatch) => void;
  onTransmettre: () => void;
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
  onPublish,
  onUnpublish,
  children,
}: Props) => {
  const isPublished = isPublieDemarchePcaetStatus(demarche.statut);
  const estAval = demarche.avalModifiable;

  // La transmission ferme le dossier d'élaboration sans retour possible : elle
  // passe par une confirmation, d'où que vienne le clic — la barre d'étapes ou
  // le panneau d'avancement.
  const [isConfirmationOuverte, setIsConfirmationOuverte] = useState(false);
  const demanderConfirmation = () => setIsConfirmationOuverte(true);

  // L'acte qui clôt le temps parcouru. Un dossier publié n'en a plus : sa
  // dernière sous-étape reste consultable, mais tout est validé.
  const finalAction = estAval
    ? isPublished
      ? null
      : {
          transition: demarche.transitions.publier,
          label: appLabels.demarcheTransitionPublier,
          dataTest: 'demarches.steps-nav.publier',
          onClick: onPublish,
        }
    : {
        transition: demarche.transitions.transmettre_pour_avis,
        label: appLabels.demarcheAvanceValiderDepot,
        dataTest: 'demarches.steps-nav.transmettre',
        onClick: demanderConfirmation,
      };

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
      onTransmettre: demanderConfirmation,
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
        {/* La barre d'étapes déroule le temps courant du dossier — l'un ou
            l'autre, jamais les deux : les pièces, le diagnostic, le plan, puis
            l'acte qui le clôt. */}
        <DemarcheStepsNav
          demarche={demarche}
          collectiviteId={collectiviteId}
          completion={completion}
          activeSection={activeSection}
          etape={estAval ? 'aval' : 'amont'}
          finalAction={finalAction}
          onOpenProgressPanel={open}
        />
      </DemarcheDetailLayout.Container>

      {isConfirmationOuverte && (
        <TransmettrePourAvisModal
          onConfirm={onTransmettre}
          onClose={() => setIsConfirmationOuverte(false)}
        />
      )}
    </DemarcheDetailLayout.Root>
  );
};
