'use client';

import {
  DEPRECATED_useActionDefinition,
  useActionId,
} from '@/app/referentiels/actions/action-context';
import { useReferentielId } from '@/app/referentiels/referentiel-context';
import {
  ActionDefinitionSummary,
  useActionDownToTache,
} from '@/app/referentiels/referentiel-hooks';
import { useSidePanel } from '@/app/ui/layout/side-panel/side-panel.context';
import { ReferentielId } from '@tet/domain/referentiels';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react';
import { SidePanelInnerContent } from '.';
import {
  ActionPanelId,
  ActionSidePanelContextType,
  ActivePanel,
} from './types';

const ActionSidePanelContext = createContext<
  ActionSidePanelContextType | undefined
>(undefined);

const getPanelTitle = (
  panelId: ActionPanelId,
  targetActionId: string | undefined,
  actionDefinition: ActionDefinitionSummary | undefined,
  actionDescendants: ActionDefinitionSummary[]
): string => {
  if (panelId === 'comments') {
    return 'Commentaires';
  }
  const actionToDisplay = targetActionId
    ? actionDescendants.find((a) => a.id === targetActionId)
    : actionDefinition;

  if (!actionToDisplay) {
    return '';
  }
  return `${actionToDisplay.identifiant} ${actionToDisplay.nom}`;
};

function PanelContentManager({
  activePanel,
  onPanelChange,
  actionId,
  referentielId,
  actionDefinition,
  actionDescendants,
}: {
  activePanel: ActivePanel | undefined;
  onPanelChange: (panel: ActivePanel | undefined) => void;
  actionId: string;
  referentielId: ReferentielId;
  actionDefinition?: ActionDefinitionSummary;
  actionDescendants: ActionDefinitionSummary[];
}): null {
  const { setPanel, setTitle } = useSidePanel({
    onClose: () => onPanelChange(undefined),
  });

  useEffect(() => {
    if (!activePanel) {
      setPanel({ type: 'close' });
      return;
    }

    setPanel({
      type: 'open',
      isPersistentWithNextPath: (path) => path.includes('/action/'),
      title: getPanelTitle(
        activePanel.panelId,
        activePanel.targetActionId,
        actionDefinition,
        actionDescendants
      ),
      Title: ({ title }) => (
        <h5 className="text-primary-9 font-bold leading-7 text-xl">{title}</h5>
      ),
      content: (
        <div className="px-6 py-4">
          <SidePanelInnerContent
            panelId={activePanel.panelId}
            targetActionId={activePanel.targetActionId}
            actionId={actionId}
            referentielId={referentielId}
            actionDefinition={actionDefinition}
            actionDescendants={actionDescendants}
            setTitle={setTitle}
          />
        </div>
      ),
    });
  }, [
    activePanel,
    setPanel,
    actionDefinition,
    actionDescendants,
    actionId,
    referentielId,
    setTitle,
  ]);

  return null;
}

export function ActionSidePanelProvider({
  activePanel,
  onPanelChange,
  children,
}: {
  activePanel: ActivePanel | undefined;
  onPanelChange: (panel: ActivePanel | undefined) => void;
  children: ReactNode;
}): ReactNode {
  const actionId = useActionId();
  const actionDefinition = DEPRECATED_useActionDefinition();
  const referentielId = useReferentielId();
  const actionDescendants = useActionDownToTache(
    referentielId,
    actionDefinition?.identifiant ?? ''
  );

  const isActive = useCallback(
    (panelId: ActionPanelId, targetActionId?: string): boolean =>
      activePanel?.panelId === panelId &&
      activePanel?.targetActionId === targetActionId,
    [activePanel]
  );

  const togglePanel = useCallback(
    (panelId: ActionPanelId, targetActionId?: string): void => {
      if (isActive(panelId, targetActionId)) {
        onPanelChange(undefined);
      } else {
        onPanelChange({ panelId, targetActionId });
      }
    },
    [isActive, onPanelChange]
  );

  const contextValue = useMemo(
    () => ({ togglePanel, isActive }),
    [togglePanel, isActive]
  );

  return (
    <ActionSidePanelContext value={contextValue}>
      <PanelContentManager
        activePanel={activePanel}
        onPanelChange={onPanelChange}
        actionId={actionId}
        referentielId={referentielId}
        actionDefinition={actionDefinition}
        actionDescendants={actionDescendants}
      />
      {children}
    </ActionSidePanelContext>
  );
}

export function useActionSidePanel(): ActionSidePanelContextType {
  const context = useContext(ActionSidePanelContext);
  if (!context) {
    throw new Error(
      'useActionSidePanel doit être utilisé dans ActionSidePanelProvider'
    );
  }
  return context;
}
