'use client';

import { DownloadDocs } from '@/app/referentiels/actions/action-documents.download-button';
import ActionPreuvePanel from '@/app/referentiels/actions/action-preuve.panel';
import { ActionDefinitionSummary } from '@/app/referentiels/referentiel-hooks';
import { ReactNode } from 'react';

export function DocumentsPanelContent({
  actionDefinition,
  subActionId,
}: {
  actionDefinition: ActionDefinitionSummary;
  subActionId?: string;
}): ReactNode {
  return (
    <section className="flex flex-col gap-5">
      <DownloadDocs action={actionDefinition} />
      <ActionPreuvePanel
        withSubActions={!subActionId}
        showWarning
        displayInPanel
        action={actionDefinition}
      />
    </section>
  );
}
