import { makeTdbCollectiviteUrl } from '@/app/app/paths';
import { getCollectiviteForRequest } from '@/app/collectivites/get-collectivite-for-request.server';
import { getUser } from '@tet/api/users/user-details.fetch.server';
import { hasPriorisationReadPermission } from '@tet/domain/collectivites';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';
import z from 'zod';

export default async function Layout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ collectiviteId: string }>;
}) {
  const { collectiviteId: unsafeCollectiviteId } = await params;
  const collectiviteId = z.coerce.number().parse(unsafeCollectiviteId);

  const [user, { collectivite }] = await Promise.all([
    getUser(),
    getCollectiviteForRequest(collectiviteId),
  ]);

  const isPriorisationReadable = hasPriorisationReadPermission(user, {
    collectiviteId,
    collectiviteAccesRestreint: collectivite.collectiviteAccesRestreint,
  });

  if (!isPriorisationReadable) {
    redirect(makeTdbCollectiviteUrl({ collectiviteId }));
  }

  return children;
}
