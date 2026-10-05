import { useIsFeatureFlagEnabled } from '@/app/utils/posthog/use-is-feature-flag-enabled';
import { useQuery } from '@tanstack/react-query';
import { RouterOutput, useTRPC } from '@tet/api';

export type PlanSecteursCounts =
  RouterOutput['plans']['fiches']['listPlanSecteursCounts'][number];

export const useListPlanSecteursCounts = (
  collectiviteId: number,
  planIds: number[]
) => {
  const trpc = useTRPC();
  const isEnabled = useIsFeatureFlagEnabled('is-fiche-secteurs-enabled');
  const sortedPlanIds = [...new Set(planIds)].sort((a, b) => a - b);

  const { data } = useQuery(
    trpc.plans.fiches.listPlanSecteursCounts.queryOptions(
      { collectiviteId, planIds: sortedPlanIds },
      { enabled: isEnabled && sortedPlanIds.length > 0 }
    )
  );

  return {
    isEnabled,
    countsByPlanId: new Map(data?.map((counts) => [counts.planId, counts])),
  };
};
