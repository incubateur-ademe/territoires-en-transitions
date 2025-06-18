'use client';

import { useCurrentCollectivite } from '@/api/collectivites';
import { useUser } from '@/api/users/user-provider';
import { Button } from '@/ui/design-system/Button/Button';
import { InviteMemberModal } from 'app.territoiresentransitions.react/app/(authed)/collectivite/[collectiviteId]/(acces-restreint)/users/_components/invite-member.modal';
import { useSendInvitation } from 'app.territoiresentransitions.react/app/(authed)/collectivite/[collectiviteId]/(acces-restreint)/users/_components/use-invite-member';
import { useState } from 'react';

export function InviteMemberButton() {
  const user = useUser();
  const collectivite = useCurrentCollectivite();
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const { data: sendData } = useSendInvitation(
    collectivite,
    user
  );

  if (!user?.id || !collectivite.collectiviteId) return null;

  const { niveauAcces } = collectivite;
  const canInvite = niveauAcces === 'admin' || niveauAcces === 'edition';

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
