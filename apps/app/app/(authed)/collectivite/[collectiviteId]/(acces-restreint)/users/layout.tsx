import { InviteMembreButton } from '@/app/collectivites/membres/invite-membre/invite-membre.button';
import { getUser } from '@tet/api/users/user-details.fetch.server';
import { hasPermission } from '@tet/domain/users';
import { VisibleWhen } from '@tet/ui';
import { ReactNode } from 'react';
import { z } from 'zod';

/**
 * Affiche les onglets de gestion des membres
 */
export default async function Layout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ collectiviteId: string }>;
}) {
  const { collectiviteId: unsafeCollectiviteId } = await params;
  const collectiviteId = z.coerce.number().parse(unsafeCollectiviteId);

  const user = await getUser();

  const canInvite = hasPermission(user, 'collectivites.membres.mutate', {
    collectiviteId,
  });

  return (
    <>
      <div
        data-test="Users"
        className="flex max-md:flex-col gap-y-4 justify-between md:items-center mb-4"
      >
        <h2 className="mb-0 max-md:order-2">Gestion des utilisateurs</h2>

        <VisibleWhen condition={canInvite}>
          <InviteMembreButton />
        </VisibleWhen>
      </div>

      {children}
    </>
  );
}
