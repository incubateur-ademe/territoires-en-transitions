'use client';

import { useCurrentCollectivite } from '@/api/collectivites';
import { useUser } from '@/api/users/user-provider';
import { tabsClassname } from '@/ui/design-system/Tabs/Tabs.next';
import { useSendInvitation } from '../_components/use-invite-member';
import MembreListTable from './_components/MembreListTable';

export default function MembresPage() {
  const user = useUser();
  const collectivite = useCurrentCollectivite();

  const { mutate: sendInvitation } = useSendInvitation(
    collectivite.collectiviteId,
    collectivite.nom,
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
