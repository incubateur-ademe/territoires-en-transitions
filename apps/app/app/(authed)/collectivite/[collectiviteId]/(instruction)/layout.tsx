import { makeTdbCollectiviteUrl } from '@/app/app/paths';
import { ErreurAccesPage } from '@/app/demarches/pcaet/erreur-acces/erreur-acces.page';
import { getCollectivite } from '@tet/api/collectivites/index.server';
import { getUser } from '@tet/api/users/user-details.fetch.server';
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

  const [collectivite, user] = await Promise.all([
    getCollectivite(collectiviteId),
    getUser(),
  ]);

  // Le type de la collectivité ne suffit pas : sans test d'appartenance, le mode
  // visite ouvrirait l'espace instructeur — et la nav DREAL — de n'importe quel
  // service déconcentré à tout utilisateur vérifié.
  const estMembre = user.collectivites.some(
    (acces) => acces.collectiviteId === collectiviteId
  );

  if (!isServiceDeconcentre(collectivite.collectiviteType) || !estMembre) {
    return (
      <ErreurAccesPage
        dashboardHref={makeTdbCollectiviteUrl({ collectiviteId })}
      />
    );
  }

  return children;
}
