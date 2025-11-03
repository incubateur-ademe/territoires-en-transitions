import { getUser } from '@/api/users/user-details.fetch.server';
import { VisibleWhen } from '@/ui/design-system/VisibleWhen';
import { ReactNode } from 'react';
import { z } from 'zod';
import { InviteMemberButton } from '../../../../../../src/users/components/invite-member.button';

/**
 * Affiche les onglets de gestion des membres
 */
export default async function Layout({
  tabs,
  params,
}: {
  tabs: ReactNode;
  params: Promise<{ collectiviteId: string }>;
}) {
  const { collectiviteId: unsafeCollectiviteId } = await params;
  const collectiviteId = z.coerce.number().parse(unsafeCollectiviteId);

  const user = await getUser();
  const collectivite = user.collectivites.find(
    (c) => c.collectiviteId === collectiviteId
  );

  const canInvite =
    collectivite?.niveauAcces === 'admin' ||
    collectivite?.niveauAcces === 'edition';

  return (
    <>
      <div
        data-test="Users"
        className="flex max-md:flex-col gap-y-4 justify-between md:items-center mb-4"
      >
        <h1 className="mb-0 max-md:order-2">Gestion des utilisateurs</h1>
        <VisibleWhen condition={canInvite}>
          <InviteMemberButton />
        </VisibleWhen>
      </div>

      {tabs}
    </>
  );
}
