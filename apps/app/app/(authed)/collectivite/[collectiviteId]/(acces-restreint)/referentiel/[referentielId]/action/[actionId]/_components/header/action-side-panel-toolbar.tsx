'use client';

import { ReactNode } from 'react';
import { SidePanelButton } from '../side-panel/buttons';
import { useActionMetadataCount } from '../side-panel/use-metadata-count';
import { VerticalDivider } from './vertical-divider';

export function ActionSidePanelToolbar({
  actionDefinitionId,
}: {
  actionDefinitionId: string;
}): ReactNode {
  const { documents, indicateurs, fiches } =
    useActionMetadataCount(actionDefinitionId);

  return (
    <div role="toolbar" aria-label="Panneaux latéraux" className="flex flex-row flex-wrap items-center content-start gap-3">
      <SidePanelButton panelId="documents" count={documents} />
      <VerticalDivider />
      <SidePanelButton panelId="indicateurs" count={indicateurs} />
      <VerticalDivider />
      <SidePanelButton panelId="fiches" count={fiches} />
      <VerticalDivider />
      <SidePanelButton panelId="historique" />
      <VerticalDivider />
      <SidePanelButton panelId="informations" />
    </div>
  );
}
