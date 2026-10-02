'use client';

import { makeCollectiviteDemarchePcaetUrl } from '@/app/app/paths';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { useCollectiviteContext } from '@tet/api/collectivites';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Point d'entrée du site public (« Commencer mon dépôt ») : le site ne connaît
 * pas la collectivité de l'utilisateur, on la résout ici après la connexion.
 */
export default function RedirectToDemarchePcaetPage() {
  const { collectivite } = useCollectiviteContext();
  const router = useRouter();

  const collectiviteId = collectivite?.collectiviteId;

  useEffect(() => {
    if (collectiviteId === undefined) {
      return;
    }
    router.replace(makeCollectiviteDemarchePcaetUrl({ collectiviteId }));
  }, [collectiviteId, router]);

  return <SpinnerLoader className="m-auto" />;
}
