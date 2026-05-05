'use client';

import { useCurrentCollectivite } from '@tet/api/collectivites';
import { ReactNode } from 'react';
import { SidePanelButton } from '../side-panel/buttons';
import { useActionMetadataCount } from '../side-panel/use-metadata-count';

export function ActionSidePanelToolbar({
  actionId,
}: {
  actionId: string;
}): ReactNode {
  const { documents, indicateurs, fiches, comments } =
    useActionMetadataCount(actionId);
  const { hasCollectivitePermission } = useCurrentCollectivite();
  const canReadComments = hasCollectivitePermission(
    'referentiels.discussions.read'
  );

  return (
    <div
      role="toolbar"
      aria-label="Panneaux latéraux"
      className="flex flex-row flex-wrap items-center content-start gap-2"
    >
      {canReadComments && (
        <SidePanelButton panelId="comments" count={comments} />
      )}

      <SidePanelButton panelId="documents" count={documents} />
      <SidePanelButton panelId="indicateurs" count={indicateurs} />
      <SidePanelButton panelId="fiches" count={fiches} />
      <SidePanelButton panelId="historique" />
      <SidePanelButton panelId="informations" />
    </div>
  );
}
