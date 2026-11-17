import { makeTdbCollectiviteUrl } from '@/app/app/paths';
import { ErreurAccesPage } from '@/app/demarches/pcaet/erreur-acces/erreur-acces.page';
import { getCollectivite } from '@tet/api/collectivites/index.server';
import { getUser } from '@tet/api/users/user-details.fetch.server';
import { isTypeInstructeur } from '@tet/domain/demarches';
import { hasPermission } from '@tet/domain/users';
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

  // L'espace est réservé aux membres et au support en mode super admin.
  const estMembre = user.collectivites.some(
    (acces) => acces.collectiviteId === collectiviteId
  );

  // Instruire, ce n'est pas être un service déconcentré : un conseil régional
  // consulte les dossiers de sa région tout en gardant son espace propre.
  if (
    !isTypeInstructeur(collectivite.collectiviteType) ||
    (!estMembre && !hasPermission(user, 'demarches.pcaet.read_instruction'))
  ) {
    return (
      <ErreurAccesPage
        dashboardHref={makeTdbCollectiviteUrl({ collectiviteId })}
      />
    );
  }

  return children;
}
