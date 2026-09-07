'use client';

import { makeCollectiviteRootUrl } from '@/app/app/paths';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { useCollectiviteContext } from '@tet/api/collectivites';
import { useUser } from '@tet/api/users';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * `makeCollectiviteRootUrl` et non `makeUserTdbUrl` : un service de l'État n'a
 * pas de tableau de bord, son espace est celui de l'instruction. L'y envoyer
 * quand même l'accueillait avec une page d'erreur d'accès — le seul écran que
 * voyait un agent rattaché à sa DREAL.
 */
export default function RedirectToTdbPage() {
  const { collectivite } = useCollectiviteContext();
  const user = useUser();
  const router = useRouter();

  const collectiviteId = collectivite?.collectiviteId;
  const collectiviteType = collectivite?.collectiviteType;

  useEffect(() => {
    if (collectiviteId === undefined || collectiviteType === undefined) {
      return;
    }
    router.replace(
      makeCollectiviteRootUrl({ user, collectiviteId, collectiviteType })
    );
  }, [collectiviteId, collectiviteType, router, user]);

  return <SpinnerLoader className="m-auto" />;
}
