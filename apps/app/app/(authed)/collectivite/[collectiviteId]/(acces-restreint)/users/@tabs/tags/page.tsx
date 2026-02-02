'use client';

import { useCurrentCollectivite } from '@tet/api/collectivites';
import { useUser } from '@tet/api/users';
import { Alert } from '@tet/ui';
import { useSendInvitation } from '../../_components/use-invite-member';
import { TagsListeTable } from './_components/tags-liste-table';

export default function TagsPage() {
  const user = useUser();
  const collectivite = useCurrentCollectivite();

  const { mutate: sendInvitation } = useSendInvitation(
    collectivite.collectiviteId,
    collectivite.nom,
    user
  );

  if (!user?.id || !collectivite.collectiviteId) return null;

  const { collectiviteId, role } = collectivite;

  return (
    <>
      <Alert
        state="info"
        description="Dans cette vue, apparaissent uniquement les tags pilotes qui n'ont pas déjà été associés à des comptes utilisateurs. Si vous souhaitez modifier les informations d'un utilisateur, cela se fait dans l'onglet Informations utilisateurs."
        className="mb-4"
      />
      <div className="p-7 border border-grey-3 bg-white rounded-lg">
        <TagsListeTable
          collectiviteId={collectiviteId}
          currentUserAccess={role ?? 'lecture'}
          sendInvitation={sendInvitation}
        />
      </div>
    </>
  );
}
