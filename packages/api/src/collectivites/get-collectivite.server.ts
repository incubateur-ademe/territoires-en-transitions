import 'server-only';

import { CollectiviteRolesAndPermissions } from '@tet/domain/users';
import { cache } from 'react';
import { getUser } from '../users/user-details.fetch.server';
import {
  getQueryClient,
  trpcInServerComponent,
} from '../utils/trpc/server-client';

export const getCollectivite = cache(
  async (collectiviteId: number): Promise<CollectiviteRolesAndPermissions> => {
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
  async (collectiviteId: number): Promise<CollectiviteRolesAndPermissions> => {
    const collectivite = await getQueryClient().fetchQuery(
      trpcInServerComponent.collectivites.collectivites.get.queryOptions({
        collectiviteId,
      })
    );

    // trpcInServerComponent.users.authorizations.listCollectiviteAccesses.queryOptions({
    // collectiviteId: collectivite.id
    // })

    // Petit hack pour pouvoir faire coller le type de retour du endpoint trpc
    // avec `CollectiviteRolesAndPermissions`. Ce endpoint sert à la base pour le listing public
    // des collectivités. À voir si nécessaire à un moment de créer un endpoint plus spécifique
    // pour récupérer les collectivités en lecture seule (n'appartenant pas à l'utilisateur)
    // avec le bon format.
    return {
      collectiviteId: collectivite.id,
      collectiviteNom: collectivite.nom,
      collectiviteAccesRestreint: collectivite.accesRestreint ?? false,

      role: null,
      permissions: [],
      audits: [],

      // niveauAcces: null,
      // isRoleAuditeur: false,
      // isReadOnly: true,
      // isSimplifiedView: false,
    };
  }
);
