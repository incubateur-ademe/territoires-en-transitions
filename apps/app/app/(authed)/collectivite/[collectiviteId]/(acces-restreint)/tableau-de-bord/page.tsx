'use client';

import { makeTdbCollectiviteUrl } from '@/app/app/paths';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { useUser } from '@tet/api/users';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function RedirectToTdbPage() {
  const currentCollectivite = useCurrentCollectivite();
  const user = useUser();
  const router = useRouter();

  const isUserCollectivite = user.collectivites.some(
    (c) => c.collectiviteId === currentCollectivite.collectiviteId
  );

  useEffect(() => {
    router.replace(
      makeTdbCollectiviteUrl({
        collectiviteId: currentCollectivite.collectiviteId,
        view: isUserCollectivite ? 'personnel' : 'synthetique',
      })
    );
  }, [currentCollectivite.collectiviteId, isUserCollectivite, router]);

  return <SpinnerLoader className="m-auto" />;
}
