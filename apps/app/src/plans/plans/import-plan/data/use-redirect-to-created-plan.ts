import { makeCollectivitePlanActionUrl } from '@/app/app/paths';
import { useCollectiviteId } from '@tet/api/collectivites';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

export const useRedirectToCreatedPlan = (
  createdPlanId: number | null
): void => {
  const router = useRouter();
  const collectiviteId = useCollectiviteId();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (createdPlanId === null || hasRedirected.current) {
      return;
    }
    hasRedirected.current = true;
    router.push(
      makeCollectivitePlanActionUrl({
        collectiviteId,
        planActionUid: createdPlanId.toString(),
      })
    );
  }, [createdPlanId, collectiviteId, router]);
};
