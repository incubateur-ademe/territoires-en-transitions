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

/**
 * Les écrans du dossier s'ouvrent aussi en lecture seule, à un membre d'un EPCI
 * que couvre le dépôt d'un Supra : cela ne se lit pas dans les droits de
 * l'utilisateur sur le porteur. On laisse passer qui peut lire ses démarches, le
 * serveur tranche sur la démarche elle-même — refusée, elle finit en 404.
 */
export async function assertCanReadDemarchePcaet(
  collectiviteId: number
): Promise<void> {
  const user = await getUser();
  const resource = { collectiviteId };

  if (
    !hasPermission(user, 'demarches.pcaet.mutate', resource) &&
    !hasPermission(user, 'demarches.pcaet.read', resource)
  ) {
    notFound();
  }
}
