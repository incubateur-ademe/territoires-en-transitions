'use client';

import { DownloadDocs } from '@/app/referentiels/actions/action-documents.download-button';
import ActionPreuvePanel from '@/app/referentiels/actions/action-preuve.panel';
import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import { ReactNode } from 'react';

export function DocumentsPanelContent({
  action,
  subActionId,
}: {
  action: ActionListItem;
  subActionId?: string;
}): ReactNode {
  return (
    <section className="flex flex-col gap-5">
      <DownloadDocs action={action} />
      <ActionPreuvePanel
        withSubActions={!subActionId}
        showWarning
        displayInPanel
        action={action}
      />
    </section>
  );
}
