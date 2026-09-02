import 'server-only';

import { ContexteInstruction, isTypeInstructeur } from '@tet/domain/demarches';
import { CollectiviteRolesAndPermissions } from '@tet/domain/users';
import { cache } from 'react';
import { getUser } from '../users/user-details.fetch.server';
import {
  getQueryClient,
  trpcInServerComponent,
} from '../utils/trpc/trpc-server-client';
import { CollectiviteWithContexteInstruction } from './collectivite-context/type';

/**
 * @param demandeAvisId Saisine désignée par l'URL d'un dossier ; sans elle, le
 * contexte rendu est la plus récente. **Tous les appelants d'une requête doivent
 * passer la même valeur** — `cache()` mémoïse par arguments, deux valeurs
 * donneraient deux contextes.
 */
export const getCollectivite = cache(
  async (
    collectiviteId: number,
    demandeAvisId?: number
  ): Promise<CollectiviteWithContexteInstruction> => {
    const user = await getUser();
    const collectiviteUserIsMemberOf = user.collectivites.find(
      (c) => c.collectiviteId === collectiviteId
    );

    // Être membre exclut d'y être en instructeur : on y est chez soi, et le
    // contexte n'a rien à annoncer. Cela évite aussi la requête pour la quasi
    // totalité des pages de collectivité.
    const [collectivite, contexteInstruction] = await Promise.all([
      collectiviteUserIsMemberOf ??
        fetchCollectiviteWhenVisiteMode(collectiviteId),
      collectiviteUserIsMemberOf
        ? null
        : fetchContexteInstruction(collectiviteId, demandeAvisId),
    ]);

    return { ...collectivite, contexteInstruction };
  }
);

/**
 * « Cette collectivité, je la consulte au titre de quel service ? »
 *
 * Court-circuité pour qui n'est membre d'aucun service instructeur, sinon la
 * question coûterait une requête sur chaque page visitée. Une panne rend `null`
 * plutôt que d'emporter le layout : là où le contexte garde une route, `null`
 * ferme l'accès.
 */
const fetchContexteInstruction = cache(
  async (
    collectiviteId: number,
    demandeAvisId?: number
  ): Promise<ContexteInstruction | null> => {
    const user = await getUser();

    const membreDunService = user.collectivites.some((acces) =>
      isTypeInstructeur(acces.collectiviteType)
    );
    if (!membreDunService) {
      return null;
    }

    try {
      return await getQueryClient().fetchQuery(
        trpcInServerComponent.demarches.pcaet.getContexteInstruction.queryOptions(
          { collectiviteId, demandeAvisId }
        )
      );
    } catch {
      return null;
    }
  }
);

const fetchCollectiviteWhenVisiteMode = cache(
  async (collectiviteId: number): Promise<CollectiviteRolesAndPermissions> => {
    const collectivite = await getQueryClient().fetchQuery(
      trpcInServerComponent.collectivites.collectivites.get.queryOptions({
        collectiviteId,
      })
    );

    // Petit hack pour pouvoir faire coller le type de retour du endpoint trpc
    // avec `CollectiviteRolesAndPermissions`. Ce endpoint sert à la base pour le listing public
    // des collectivités. À voir si nécessaire à un moment de créer un endpoint plus spécifique
    // pour récupérer les collectivités en lecture seule (n'appartenant pas à l'utilisateur)
    // avec le bon format.
    return {
      collectiviteId: collectivite.id,
      collectiviteNom: collectivite.nom,
      collectiviteType: collectivite.type,
      collectiviteAccesRestreint: collectivite.accesRestreint ?? false,
      collectivitePreferences: collectivite.preferences,
      role: null,
      permissions: [],
      audits: [],
    };
  }
);
