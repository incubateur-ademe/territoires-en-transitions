'use client';

import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { useCollectiviteId } from '@tet/api/collectivites';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function RedirectToPlansPage() {
  const currentCollectiviteId = useCollectiviteId();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/collectivite/${currentCollectiviteId}/plans`);
  }, [currentCollectiviteId, router]);

  return <SpinnerLoader />;
}
