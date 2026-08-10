import { makeDemandesAvisUrl } from '@/app/app/paths';
import { ErreurAccesPage } from '@/app/demarches/pcaet/erreur-acces/erreur-acces.page';
import { getCollectivite } from '@tet/api/collectivites/index.server';
import { isServiceDeconcentre } from '@tet/domain/collectivites';
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

  const collectivite = await getCollectivite(collectiviteId);

  if (isServiceDeconcentre(collectivite.collectiviteType)) {
    return (
      <ErreurAccesPage dashboardHref={makeDemandesAvisUrl({ collectiviteId })} />
    );
  }

  return children;
}
