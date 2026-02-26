'use client';

import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Button } from '@tet/ui';
import { useState } from 'react';
import { InviteMemberModal } from './invite-membre.modal';

export function InviteMembreButton() {
  const collectivite = useCurrentCollectivite();
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const { hasCollectivitePermission } = collectivite;
  const canInviteMembre = hasCollectivitePermission(
    'collectivites.membres.mutate'
  );

  if (!canInviteMembre) {
    return null;
  }

  return (
    <>
      <Button
        data-test="invite"
        size="sm"
        className="h-fit"
        onClick={() => setIsInviteOpen(true)}
      >
        Inviter un membre
      </Button>

      <InviteMemberModal
        openState={{ isOpen: isInviteOpen, setIsOpen: setIsInviteOpen }}
      />
    </>
  );
}
