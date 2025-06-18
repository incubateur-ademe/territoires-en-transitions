'use client';

import { useCurrentCollectivite } from '@/api/collectivites';
import { useUser } from '@/api/users/user-provider';
import { tabsClassname } from '@/ui/design-system/Tabs/Tabs.next';
import MembreListTable from 'app.territoiresentransitions.react/app/(authed)/collectivite/[collectiviteId]/(acces-restreint)/users/@tabs/_components/MembreListTable';
import { useSendInvitation } from 'app.territoiresentransitions.react/app/(authed)/collectivite/[collectiviteId]/(acces-restreint)/users/_components/use-invite-member';

export default function MembresPage() {
  const user = useUser();
  const collectivite = useCurrentCollectivite();

  const { mutate: sendInvitation } = useSendInvitation(
    collectivite,
    user
  );

  if (!user?.id || !collectivite.collectiviteId) return null;

  const { collectiviteId, niveauAcces } = collectivite;

  return (
    <div className={tabsClassname}>
      <MembreListTable
        collectiviteId={collectiviteId}
        currentUserId={user.id}
        currentUserAccess={niveauAcces ?? 'lecture'}
        sendInvitation={sendInvitation}
      />
    </div>
  );
}
