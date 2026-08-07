'use client';

import { collectiviteDemarchePcaetPath } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { useSidePanel } from '@/app/ui/layout/side-panel/side-panel.context';
import { useCallback, useEffect, useRef } from 'react';
import {
  DemarcheAvanceSidePanelContent,
  type DemarcheAvanceSidePanelContentProps,
} from './avance.side-panel-content';

const DEMARCHE_PATH_SEGMENT = `/${collectiviteDemarchePcaetPath
  .split('/')
  .pop()}`;

/**
 * Le panneau survit à la navigation entre les pages d'une même démarche. Le
 * segment vient des constructeurs d'URL : il restera à le dériver du type le
 * jour où un second type de démarche aura ses propres routes.
 */
const isDemarchePath = (path: string): boolean =>
  path.includes(DEMARCHE_PATH_SEGMENT);

const PANEL_TITLE = appLabels.demarcheAvanceTitre;

type UseDemarcheAvanceSidePanelOptions = {
  /** Ouvre le panneau au montage (ex. page de création). */
  defaultOpen?: boolean;
};

/**
 * Ouvre / ferme le SidePanel global avec l’avancée de la démarche.
 * Persiste à la navigation entre pages d’une même démarche.
 */
export function useDemarcheAvanceSidePanel(
  contentProps: DemarcheAvanceSidePanelContentProps,
  { defaultOpen = false }: UseDemarcheAvanceSidePanelOptions = {}
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
      isPersistentWithNextPath: isDemarchePath,
      Title: ({ title }) => (
        <h5 className="text-primary-9 font-bold leading-7 text-xl m-0">
          {title}
        </h5>
      ),
      content: <DemarcheAvanceSidePanelContent {...props} />,
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
