'use client';

import { makeTdbCollectiviteUrl } from '@/app/app/paths';
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
  const isUserCollectivite = user.collectivites.some(
    (c) => c.collectiviteId === collectiviteId
  );

  useEffect(() => {
    if (!collectiviteId) return;
    router.replace(
      makeTdbCollectiviteUrl({
        collectiviteId,
        view: isUserCollectivite ? 'personnel' : 'synthetique',
      })
    );
  }, [collectiviteId, isUserCollectivite, router]);

  return <SpinnerLoader className="m-auto" />;
}
