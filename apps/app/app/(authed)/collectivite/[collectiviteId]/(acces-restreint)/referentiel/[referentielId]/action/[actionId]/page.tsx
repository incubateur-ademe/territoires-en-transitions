'use client';

import { useAction } from '@/app/referentiels/actions/action-context';
import { parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs';
import { useMemo } from 'react';
import { ActionView } from './_components/action.view';
import { ActionSidePanelProvider } from './_components/side-panel/context';
import { ACTION_PANEL_IDS, ActivePanel } from './_components/side-panel/types';

const panelSearchParamsConfig = {
  panel: parseAsStringLiteral(ACTION_PANEL_IDS),
  actionId: parseAsString,
};

const useSidePanelQueryParams = (): {
  activePanel: ActivePanel | undefined;
  handlePanelChange: (panel: ActivePanel | undefined) => void;
} => {
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

  const handlePanelChange = (panel: ActivePanel | undefined): void => {
    setSearchParams({
      panel: panel?.panelId ?? null,
      actionId: panel?.targetActionId ?? null,
    });
  };

  return { activePanel, handlePanelChange };
};

export default function Page() {
  const { activePanel, handlePanelChange } = useSidePanelQueryParams();
  const action = useAction();

  if (!action) return null;

  return (
    <ActionSidePanelProvider
      activePanel={activePanel}
      onPanelChange={handlePanelChange}
      action={action}
    >
      <ActionView action={action} />
    </ActionSidePanelProvider>
  );
}
