'use client';

import { makeUserTdbUrl } from '@/app/tableaux-de-bord/make-user-tdb-url';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { useCollectiviteContext } from '@tet/api/collectivites';
import { useUser } from '@tet/api/users';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function RedirectToTdbPage() {
  const { collectivite } = useCollectiviteContext();
  const user = useUser();
  const router = useRouter();

  const collectiviteId = collectivite?.collectiviteId;

  useEffect(() => {
    if (collectiviteId === undefined) {
      return;
    }
    router.replace(makeUserTdbUrl({ user, collectiviteId }));
  }, [collectiviteId, router, user]);

  return <SpinnerLoader className="m-auto" />;
}
