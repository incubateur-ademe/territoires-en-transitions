'use client';

import { useCollectiviteId } from '@tet/api/collectivites';
import { PageHeader } from '@tet/ui';
import { JSX } from 'react';
import { DrealCollectivitesTable } from './components/dreal-collectivites-table';
import { DrealNotificationsPopover } from './components/dreal-notifications-popover';
import { DREAL_REGION, drealCollectivites } from './vue-dreal.mock';

/**
 * Écran 1 — Vue DREAL · Dashboard.
 * Tableau des EPCI suivis en pleine largeur. Les notifications sont accessibles
 * via un bouton-cloche dans le header (popover).
 */
export const VueDrealDashboardPage = (): JSX.Element => {
  const collectiviteId = useCollectiviteId();

  return (
    <div className="flex flex-col gap-4 pb-12">
      <PageHeader>
        <PageHeader.Title>
          Suivi des PCAET de la DREAL {DREAL_REGION}
        </PageHeader.Title>
        <PageHeader.Actions>
          <DrealNotificationsPopover />
        </PageHeader.Actions>
        <PageHeader.Subtitle>
          {drealCollectivites.length} collectivités suivies · rattachées à votre
          région
        </PageHeader.Subtitle>
      </PageHeader>

      <DrealCollectivitesTable collectiviteId={collectiviteId} />
    </div>
  );
};
