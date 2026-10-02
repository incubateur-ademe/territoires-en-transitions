'use client';

import {
  makeCollectiviteDemarchePcaetUrl,
  makeCollectiviteRootUrl,
} from '@/app/app/paths';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { useCollectiviteContext } from '@tet/api/collectivites';
import { useUser } from '@tet/api/users';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Point d'entrée du site public (« Commencer mon dépôt ») : le site ne connaît
 * pas la collectivité de l'utilisateur, on la résout ici après la connexion.
 * Sans droit de dépôt (membre en lecture, service de l'État), la page des
 * démarches répondrait 404 : on le renvoie à l'accueil de sa collectivité.
 */
export default function RedirectToDemarchePcaetPage() {
  const { collectivite } = useCollectiviteContext();
  const user = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!collectivite) {
      return;
    }
    const { collectiviteId, collectiviteType } = collectivite;
    router.replace(
      collectivite.hasCollectivitePermission('demarches.pcaet.mutate')
        ? makeCollectiviteDemarchePcaetUrl({ collectiviteId })
        : makeCollectiviteRootUrl({ user, collectiviteId, collectiviteType })
    );
  }, [collectivite, router, user]);

  return <SpinnerLoader className="m-auto" />;
}
