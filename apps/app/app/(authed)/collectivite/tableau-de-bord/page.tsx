'use client';

import { useCollectiviteId } from '@/api/collectivites';
import { makeTdbCollectiviteUrl } from '@/app/app/paths';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function RedirectToTdbPage() {
  const currentCollectiviteId = useCollectiviteId();
  const router = useRouter();

  useEffect(() => {
    router.replace(
      makeTdbCollectiviteUrl({ collectiviteId: currentCollectiviteId })
    );
  }, [currentCollectiviteId, router]);

  return <SpinnerLoader className="m-auto" />;
}
