'use client';

import { useCollectiviteId } from '@/api/collectivites';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function RedirectToTdbPage() {
  const currentCollectiviteId = useCollectiviteId();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/collectivite/${currentCollectiviteId}/tableau-de-bord`);
  }, [currentCollectiviteId, router]);

  return <SpinnerLoader className="m-auto" />;
}
