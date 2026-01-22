'use client';

import { useCurrentCollectivite } from '@tet/api/collectivites';
import { useUser } from '@tet/api/users';
import { Button } from '@tet/ui';
import { useState } from 'react';
import { InviteMemberModal } from './invite-member.modal';
import { useSendInvitation } from './use-invite-member';

export function InviteMemberButton() {
  const user = useUser();
  const collectivite = useCurrentCollectivite();
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const { data: sendData } = useSendInvitation(
    collectivite.collectiviteId,
    collectivite.nom,
    user
  );

  if (!user?.id || !collectivite.collectiviteId) return null;

  const { hasCollectivitePermission } = collectivite;
  const canInvite = hasCollectivitePermission('collectivites.membres.mutate');

  if (!canInvite) return null;

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
        sendData={sendData}
      />
    </>
  );
}
