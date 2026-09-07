'use client';

import { makeCollectiviteRootUrl } from '@/app/app/paths';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { useUser } from '@tet/api/users';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/** Même règle que le redirecteur global : le type décide de la racine. */
export default function RedirectToTdbPage() {
  const { collectiviteId, collectiviteType } = useCurrentCollectivite();
  const user = useUser();
  const router = useRouter();

  useEffect(() => {
    router.replace(
      makeCollectiviteRootUrl({ user, collectiviteId, collectiviteType })
    );
  }, [collectiviteId, collectiviteType, router, user]);

  return <SpinnerLoader className="m-auto" />;
}
