'use client';

import { InviteMembreButton } from '@/app/collectivites/membres/invite-membre/invite-membre.button';
import { PageHeader } from '@tet/ui';
import { ReactElement } from 'react';

export const UsersHeader = ({
  canInvite,
}: {
  canInvite: boolean;
}): ReactElement => (
  <PageHeader>
    <PageHeader.Title>Gestion des utilisateurs</PageHeader.Title>
    {canInvite && (
      <PageHeader.Actions>
        <InviteMembreButton />
      </PageHeader.Actions>
    )}
  </PageHeader>
);
