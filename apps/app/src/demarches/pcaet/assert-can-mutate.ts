import { getUser } from '@tet/api/users/user-details.fetch.server';
import { hasPermission } from '@tet/domain/users';
import { notFound } from 'next/navigation';

export async function assertCanMutateDemarchePcaet(
  collectiviteId: number
): Promise<void> {
  const user = await getUser();

  if (
    !hasPermission(user, 'demarches.pcaet.mutate', {
      collectiviteId,
    })
  ) {
    notFound();
  }
}
