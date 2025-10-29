'use client';

import { useCurrentCollectivite } from '@/api/collectivites';
import { makeTdbCollectiviteUrl } from '@/app/app/paths';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function RedirectToTdbPage() {
  const currentCollectivite = useCurrentCollectivite();
  const router = useRouter();

  useEffect(() => {
    router.replace(
      makeTdbCollectiviteUrl({
        collectiviteId: currentCollectivite.collectiviteId,
        view: currentCollectivite.isSimplifiedView
          ? 'personnel'
          : 'synthetique',
      })
    );
  }, [currentCollectivite, router]);

  return <SpinnerLoader className="m-auto" />;
}
