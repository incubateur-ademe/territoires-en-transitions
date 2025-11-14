'use client';

import { useCurrentCollectivite } from '@/api/collectivites';
import { useUser } from '@/api/users';
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
    <div className="p-7 border border-grey-3 bg-white rounded-lg">
      <MembreListTable
        collectiviteId={collectiviteId}
        currentUserId={user.id}
        currentUserAccess={niveauAcces ?? 'lecture'}
        sendInvitation={sendInvitation}
      />
    </div>
  );
}
