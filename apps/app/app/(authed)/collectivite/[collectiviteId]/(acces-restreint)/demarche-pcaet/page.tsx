import { ListDemarchesPcaetPage } from '@/app/demarches/pcaet/list-demarches/list-demarches-pcaet.page';
import { ListPublicDemarchesPcaetPage } from '@/app/demarches/pcaet/list-demarches/list-public-demarches-pcaet.page';
import { getUser } from '@tet/api/users/user-details.fetch.server';
import { hasPermission } from '@tet/domain/users';
import { notFound } from 'next/navigation';
import { z } from 'zod';

export default async function Page({
  params,
}: {
  params: Promise<{ collectiviteId: string }>;
}) {
  const { collectiviteId: unsafeCollectiviteId } = await params;
  const collectiviteId = z.coerce.number().safeParse(unsafeCollectiviteId);

  if (!collectiviteId.success) {
    notFound();
  }

  const user = await getUser();
  const resource = { collectiviteId: collectiviteId.data };

  // Qui édite les démarches les gère toutes ; qui lit seulement la collectivité
  // n'en voit que les statuts publics.
  if (hasPermission(user, 'demarches.pcaet.mutate', resource)) {
    return <ListDemarchesPcaetPage />;
  }
  if (hasPermission(user, 'demarches.pcaet.read', resource)) {
    return <ListPublicDemarchesPcaetPage />;
  }

  notFound();
}
