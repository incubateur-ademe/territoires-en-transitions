'use client';

import { InviteMembreButton } from '@/app/collectivites/membres/invite-membre/invite-membre.button';
import { appLabels } from '@/app/labels/catalog';
import { PageHeader } from '@tet/ui';
import { ReactElement } from 'react';

export const UsersHeader = ({
  canInvite,
}: {
  canInvite: boolean;
}): ReactElement => (
  <PageHeader>
    <PageHeader.Title>{appLabels.gestionDesUtilisateurs}</PageHeader.Title>
    {canInvite && (
      <PageHeader.Actions>
        <InviteMembreButton />
      </PageHeader.Actions>
    )}
  </PageHeader>
);
