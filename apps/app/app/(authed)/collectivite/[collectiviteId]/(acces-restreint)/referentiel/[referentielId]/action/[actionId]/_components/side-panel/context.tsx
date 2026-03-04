'use client';

import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import { useSidePanel } from '@/app/ui/layout/side-panel/side-panel.context';
import {
  getReferentielIdFromActionId,
  ReferentielId,
} from '@tet/domain/referentiels';
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
  action: ActionListItem
): string => {
  if (panelId === 'comments') {
    return 'Commentaires';
  }

  return `${action.identifiant} ${action.nom}`;
};

function PanelContentManager({
  activePanel,
  onPanelChange,
  referentielId,
  action,
}: {
  activePanel: ActivePanel | undefined;
  onPanelChange: (panel: ActivePanel | undefined) => void;
  referentielId: ReferentielId;
  action: ActionListItem;
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
        action
        // activePanel.targetActionId
      ),
      Title: ({ title }) => (
        <h5 className="text-primary-9 font-bold leading-7 text-xl">{title}</h5>
      ),
      content: (
        <div className="px-6 py-4">
          <SidePanelInnerContent
            panelId={activePanel.panelId}
            targetActionId={activePanel.targetActionId}
            referentielId={referentielId}
            action={action}
            setTitle={setTitle}
          />
        </div>
      ),
    });
  }, [activePanel, setPanel, action, referentielId, setTitle]);

  return null;
}

export function ActionSidePanelProvider({
  activePanel,
  onPanelChange,
  action,
  children,
}: {
  activePanel: ActivePanel | undefined;
  onPanelChange: (panel: ActivePanel | undefined) => void;
  action: ActionListItem;
  children: ReactNode;
}): ReactNode {
  const referentielId = getReferentielIdFromActionId(action.actionId);

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
        referentielId={referentielId}
        action={action}
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
