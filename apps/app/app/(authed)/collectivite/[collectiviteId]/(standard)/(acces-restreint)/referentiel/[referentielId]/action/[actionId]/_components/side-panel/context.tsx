'use client';

import { useGetAction } from '@/app/referentiels/actions/use-get-action';
import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import { useSidePanel } from '@/app/ui/layout/side-panel/side-panel.context';
import {
  getReferentielIdFromActionId,
  ReferentielId,
} from '@tet/domain/referentiels';
import { parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs';
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
  OPENED_SECTIONS_QUERY_PARAM,
  openedSectionsParser,
} from './informations.config';
import {
  ACTION_PANEL_IDS,
  ActionPanelId,
  ActionPanelIdEnum,
  ActionSidePanelContextType,
  ActivePanel,
} from './types';

const panelSearchParamsConfig = {
  panel: parseAsStringLiteral(ACTION_PANEL_IDS),
  actionId: parseAsString,
  [OPENED_SECTIONS_QUERY_PARAM]: openedSectionsParser,
};

function openedSectionsSearchParamForPanel(
  panel: ActivePanel | undefined
): { [OPENED_SECTIONS_QUERY_PARAM]: null } | Record<string, never> {
  if (panel?.panelId === ActionPanelIdEnum.INFORMATIONS) {
    return {};
  }
  return { [OPENED_SECTIONS_QUERY_PARAM]: null };
}

function useSidePanelQueryParams(): {
  activePanel: ActivePanel | undefined;
  setActivePanel: (panel: ActivePanel | undefined) => void;
  activeActionId: string | null;
  setPanelSearchParams: ReturnType<
    typeof useQueryStates<typeof panelSearchParamsConfig>
  >[1];
} {
  const [searchParams, setSearchParams] = useQueryStates(
    panelSearchParamsConfig,
    { history: 'replace' }
  );

  const activePanel: ActivePanel | undefined = useMemo(() => {
    if (searchParams.panel === null) {
      return undefined;
    }
    return {
      panelId: searchParams.panel,
      targetActionId: searchParams.actionId ?? undefined,
    };
  }, [searchParams.panel, searchParams.actionId]);

  const setActivePanel = useCallback(
    (panel: ActivePanel | undefined): void => {
      setSearchParams({
        panel: panel?.panelId ?? null,
        actionId: panel?.targetActionId ?? null,
        ...openedSectionsSearchParamForPanel(panel),
      });
    },
    [setSearchParams]
  );

  return {
    activePanel,
    setActivePanel,
    activeActionId: searchParams.actionId,
    setPanelSearchParams: setSearchParams,
  };
}

const ActionSidePanelContext = createContext<
  ActionSidePanelContextType | undefined
>(undefined);

const getPanelTitle = (
  panelId: ActionPanelId,
  action: ActionListItem
): string => {
  if (panelId === ActionPanelIdEnum.COMMENTS) {
    return 'Commentaires';
  }

  return `${action.identifiant} ${action.nom}`;
};

function PanelContentManager({
  activePanel,
  setActivePanel,
  referentielId,
  action,
}: {
  activePanel: ActivePanel | undefined;
  setActivePanel: (panel: ActivePanel | undefined) => void;
  referentielId: ReferentielId;
  action: ActionListItem;
}): null {
  const { setPanel, setTitle } = useSidePanel({
    onClose: () => setActivePanel(undefined),
  });

  const panelActionId = activePanel?.targetActionId ?? action.actionId;
  const panelActionFromList = useGetAction({
    actionId: panelActionId,
  });
  const panelAction =
    activePanel?.targetActionId && panelActionFromList
      ? panelActionFromList
      : action;

  useEffect(() => {
    if (!activePanel) {
      setPanel({ type: 'close' });
      return;
    }

    setPanel({
      type: 'open',
      isPersistentWithNextPath: (path) => path.includes('/action/'),
      title: getPanelTitle(activePanel.panelId, panelAction),
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
  }, [activePanel, setPanel, action, panelAction, referentielId, setTitle]);

  return null;
}

export function ActionSidePanelProvider({
  action,
  children,
}: {
  action: ActionListItem;
  children: ReactNode;
}): ReactNode {
  const { activePanel, setActivePanel, activeActionId } =
    useSidePanelQueryParams();
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
        setActivePanel(undefined);
      } else {
        setActivePanel({ panelId, targetActionId });
      }
    },
    [isActive, setActivePanel]
  );

  const contextValue = useMemo(
    () => ({ togglePanel, isActive, activeActionId }),
    [togglePanel, isActive, activeActionId]
  );

  return (
    <ActionSidePanelContext value={contextValue}>
      <PanelContentManager
        activePanel={activePanel}
        setActivePanel={setActivePanel}
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
