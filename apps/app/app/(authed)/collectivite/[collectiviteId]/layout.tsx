import { extractDemandeAvisIdFromPath } from '@/app/demarches/pcaet/instruction/dossier-instruction-path';
import { UnverifiedUserCard } from '@/app/users/unverified-user-card';
import {
  CollectiviteProviderStore,
  getCollectivite,
} from '@tet/api/collectivites/index.server';
import { getUser } from '@tet/api/users/user-details.fetch.server';
import { hasRole, PlatformRole } from '@tet/domain/users';
import { headers } from 'next/headers';
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

  // Sur la route d'un dossier, le contexte doit porter la saisine que l'URL
  // désigne — pas la plus récente. Le layout du dossier n'étant rendu qu'après
  // celui-ci, la seule façon de la connaître ici est le chemin courant, que le
  // proxy réécrit et qui n'est donc pas falsifiable (cf. `proxy.ts`).
  const demandeAvisId = extractDemandeAvisIdFromPath(
    (await headers()).get('x-current-path')
  );

  const [user, collectivite] = await Promise.all([
    getUser(),
    getCollectivite(collectiviteId, demandeAvisId ?? undefined),
  ]);

  const userIsNotInCollectivite = !user.collectivites.some(
    (collectivite) => collectivite.collectiviteId === Number(collectiviteId)
  );

  // User can be unverified and belong to a collectivite if they are the first member of this collectivite.
  // In this case, they can see their collectivite informations.
  // Here, we want to make sure that an unverified user cannot see other collectivites informations.
  //
  // La saisine ouvre une troisième porte : l'agent d'un service qui instruit
  // cette collectivité y entre sans en être membre, et sans dépendre du rôle
  // vérifié — qui ne s'obtient aujourd'hui que par invitation, donc pas pour un
  // compte rattaché à son service par ProConnect.
  const userNotAllowedToVisitCollectivite =
    !hasRole(user, PlatformRole.VERIFIED) &&
    userIsNotInCollectivite &&
    collectivite.contexteInstruction === null;

  return (
    // La bannière de contexte est rendue par `app-layout`, au-dessus du
    // conteneur de contenu : elle lit le contexte dans le store que ce provider
    // alimente.
    <CollectiviteProviderStore
      collectiviteId={collectiviteId}
      demandeAvisId={demandeAvisId ?? undefined}
    >
      {userNotAllowedToVisitCollectivite ? <UnverifiedUserCard /> : children}
    </CollectiviteProviderStore>
  );
}
