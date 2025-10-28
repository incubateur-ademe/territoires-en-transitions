import 'server-only';

import { getUser } from '@/api/users/user-details.fetch.server';
import {
  getQueryClient,
  trpcInServerComponent,
} from '@/api/utils/trpc/server-client';
import { cache } from 'react';
import { CurrentCollectivite } from './fetch-current-collectivite';

export const getCollectivite = cache(
  async (collectiviteId: number): Promise<CurrentCollectivite> => {
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
  async (collectiviteId: number): Promise<CurrentCollectivite> => {
    const collectivite = await getQueryClient().fetchQuery(
      trpcInServerComponent.collectivites.collectivites.get.queryOptions({
        collectiviteId,
      })
    );

    // Petit hack pour pouvoir faire coller le type de retour du endpoint trpc
    // avec `CurrentCollectivite`. Ce endpoint sert à la base pour le listing public
    // des collectivités. À voir si nécessaire à un moment de créer un endpoint plus spécifique
    // pour récupérer les collectivités en lecture seule (n'appartenant pas à l'utilisateur)
    // avec le bon format.
    return {
      ...collectivite,
      collectiviteId: collectivite.id,
      accesRestreint: collectivite.accesRestreint ?? false,
      niveauAcces: null,
      isRoleAuditeur: false,
      isReadOnly: true,
    };
  }
);
