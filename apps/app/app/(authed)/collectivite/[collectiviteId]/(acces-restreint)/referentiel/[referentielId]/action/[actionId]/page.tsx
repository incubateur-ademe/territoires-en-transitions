'use client';

import {
  useActionAvailabilityState,
} from '@/app/referentiels/actions/action-context';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs';
import { useMemo } from 'react';
import { ActionHiddenView } from './_components/action-hidden.view';
import { ActionNotFoundView } from './_components/action-not-found.view';
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
  const availability = useActionAvailabilityState();

  if (availability.status === 'pending') {
    return <SpinnerLoader className="m-auto" />;
  }

  if (availability.status === 'hidden') {
    return <ActionHiddenView action={availability.action} />;
  }
  if (availability.status === 'not_found') {
    return <ActionNotFoundView />;
  }

  const action = availability.action;

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
