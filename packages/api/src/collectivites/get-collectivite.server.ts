import 'server-only';

import {
  CollectiviteAccess,
  permissionsByRole,
  UserRole,
} from '@/domain/users';
import { cache } from 'react';
import { getUser } from '../users/user-details.fetch.server';
import {
  getQueryClient,
  trpcInServerComponent,
} from '../utils/trpc/server-client';

export const getCollectivite = cache(
  async (collectiviteId: number): Promise<CollectiviteAccess> => {
    const user = await getUser();
    const collectiviteUserIsMemberOf = user.collectivites.find(
      (c) => c.collectiviteId === collectiviteId
    );

    const collectivite =
      collectiviteUserIsMemberOf ??
      (await fetchCollectiviteWhenVisiteMode(collectiviteId));

    return collectivite;
  }
);

const fetchCollectiviteWhenVisiteMode = cache(
  async (collectiviteId: number): Promise<CollectiviteAccess> => {
    const collectivite = await getQueryClient().fetchQuery(
      trpcInServerComponent.collectivites.collectivites.get.queryOptions({
        collectiviteId,
      })
    );

    // Petit hack pour pouvoir faire coller le type de retour du endpoint trpc
    // avec `CollectiviteAccess`. Ce endpoint sert à la base pour le listing public
    // des collectivités. À voir si nécessaire à un moment de créer un endpoint plus spécifique
    // pour récupérer les collectivités en lecture seule (n'appartenant pas à l'utilisateur)
    // avec le bon format.
    return {
      ...collectivite,
      collectiviteId: collectivite.id,
      accesRestreint: collectivite.accesRestreint ?? false,
      niveauAcces: null,
      permissions: permissionsByRole[UserRole.VERIFIE],
      isRoleAuditeur: false,
      isReadOnly: true,
      isSimplifiedView: false,
    };
  }
);
