'use client';

import { useCurrentCollectivite } from '@/api/collectivites';
import { useUser } from '@/api/users/user-provider';
import { Alert } from '@/ui';
import { tabsClassname } from '@/ui/design-system/Tabs/Tabs.next';
import { useSendInvitation } from '../../_components/use-invite-member';
import { TagsListeTable } from './_components/tags-liste-table';

export default function TagsPage() {
  const user = useUser();
  const collectivite = useCurrentCollectivite();

  const { data: sendData, mutate: sendInvitation } = useSendInvitation(
    collectivite.collectiviteId,
    collectivite.nom,
    user
  );

  if (!user?.id || !collectivite.collectiviteId) return null;

  const { collectiviteId, niveauAcces } = collectivite;

  return (
    <>
      <Alert
        rounded
        state="info"
        description="Dans cette vue, apparaissent uniquement les tags pilotes qui n'ont pas déjà été associés à des comptes utilisateurs. Si vous souhaitez modifier les informations d'un utilisateur, cela se fait dans l'onglet Informations utilisateurs."
        className="mb-4"
      />
      <div className={tabsClassname}>
        <TagsListeTable
          collectiviteId={collectiviteId}
          currentUserAccess={niveauAcces ?? 'lecture'}
          sendData={sendData}
          sendInvitation={sendInvitation}
        />
      </div>
    </>
  );
}
