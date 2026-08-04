'use client';

import { appLabels } from '@/app/labels/catalog';
import { useSidePanel } from '@/app/ui/layout/side-panel/side-panel.context';
import { useCallback, useEffect, useRef } from 'react';
import {
  PcaetAvanceSidePanelContent,
  type PcaetAvanceSidePanelContentProps,
} from './pcaet-avance.side-panel-content';

const isPcaetPath = (path: string): boolean => path.includes('/demarche-pcaet');

const PANEL_TITLE = appLabels.demarchePcaetAvanceTitre;

type UsePcaetAvanceSidePanelOptions = {
  /** Ouvre le panneau au montage (ex. page de création). */
  defaultOpen?: boolean;
};

/**
 * Ouvre / ferme le SidePanel global avec l’avancée de la démarche PCAET.
 * Persiste à la navigation entre pages d’une même démarche.
 */
export function usePcaetAvanceSidePanel(
  contentProps: PcaetAvanceSidePanelContentProps,
  { defaultOpen = false }: UsePcaetAvanceSidePanelOptions = {}
): { isOpen: boolean; toggle: () => void } {
  const { setPanel, panel } = useSidePanel();
  const contentPropsRef = useRef(contentProps);

  useEffect(() => {
    contentPropsRef.current = contentProps;
  });

  const isOpen = panel.isOpen && panel.title === PANEL_TITLE;

  const openPanel = useCallback(() => {
    const props = contentPropsRef.current;
    setPanel({
      type: 'open',
      title: PANEL_TITLE,
      isPersistentWithNextPath: isPcaetPath,
      Title: ({ title }) => (
        <h5 className="text-primary-9 font-bold leading-7 text-xl m-0">
          {title}
        </h5>
      ),
      content: <PcaetAvanceSidePanelContent {...props} />,
    });
  }, [setPanel]);

  // Ouvre le panneau une fois au montage si demandé (page de création).
  useEffect(() => {
    if (defaultOpen) {
      openPanel();
    }
  }, [defaultOpen, openPanel]);

  // Rafraîchit le contenu après une navigation persistante ou un changement
  // d’état pertinent (completion, section active…).
  useEffect(() => {
    if (!isOpen) return;
    openPanel();
  }, [
    isOpen,
    openPanel,
    contentProps.collectiviteId,
    contentProps.demarcheId,
    contentProps.statut,
    contentProps.activeSection,
    contentProps.avisDeadlineAt,
    contentProps.isPublished,
    contentProps.canTransmettre,
    contentProps.canReprendre,
    contentProps.canPublish,
    contentProps.isPreview,
    contentProps.completion.documents,
    contentProps.completion.diagnostic,
    contentProps.completion.plan,
    contentProps.completion.canTransmettre,
  ]);

  const toggle = useCallback(() => {
    if (isOpen) {
      setPanel({ type: 'close' });
      return;
    }
    openPanel();
  }, [isOpen, openPanel, setPanel]);

  return { isOpen, toggle };
}
