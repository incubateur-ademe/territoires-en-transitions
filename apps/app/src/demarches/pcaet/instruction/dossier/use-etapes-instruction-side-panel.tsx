'use client';

import { appLabels } from '@/app/labels/catalog';
import { useSidePanel } from '@/app/ui/layout/side-panel/side-panel.context';
import { useCallback, useEffect, useRef } from 'react';
import {
  EtapesInstructionSidePanelContent,
  type EtapesInstructionSidePanelContentProps,
} from './etapes-instruction.side-panel-content';

const PANEL_TITLE = appLabels.instructionDossierEtapesTitre;

type Options = {
  /** L'URL du dossier ouvert : le panneau ne survit qu'à elle. */
  dossierPath: string;
};

export function useEtapesInstructionSidePanel(
  contentProps: EtapesInstructionSidePanelContentProps,
  { dossierPath }: Options
): { isOpen: boolean; toggle: () => void } {
  const { setPanel, panel } = useSidePanel();
  const contentPropsRef = useRef(contentProps);

  useEffect(() => {
    contentPropsRef.current = contentProps;
  });

  const isOpen = panel.isOpen && panel.title === PANEL_TITLE;

  const openPanel = useCallback(() => {
    setPanel({
      type: 'open',
      title: PANEL_TITLE,
      isPersistentWithNextPath: (path) => path === dossierPath,
      content: (
        <EtapesInstructionSidePanelContent {...contentPropsRef.current} />
      ),
    });
  }, [setPanel, dossierPath]);

  const hasAutoOpenedRef = useRef(false);
  useEffect(() => {
    if (hasAutoOpenedRef.current) return;
    hasAutoOpenedRef.current = true;
    openPanel();
  }, [openPanel]);

  // Le panneau tient un rendu figé : il faut le repousser dès que ce qu'il
  // affiche change — étape active, avis déposés, et l'apparition du pied de
  // panneau quand le dossier arrive.
  const contentSignature = JSON.stringify({
    activeEtape: contentProps.activeEtape,
    enElaboration: contentProps.enElaboration,
    avis: contentProps.avis.map(({ id, valideLe }) => [id, valideLe]),
    hasFooter: Boolean(contentProps.footer),
  });

  useEffect(() => {
    if (!isOpen) return;
    openPanel();
  }, [isOpen, openPanel, contentSignature]);

  const toggle = useCallback(() => {
    if (isOpen) {
      setPanel({ type: 'close' });
      return;
    }
    openPanel();
  }, [isOpen, openPanel, setPanel]);

  return { isOpen, toggle };
}
