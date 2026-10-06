import { useIsFeatureFlagEnabled } from '@/app/utils/posthog/use-is-feature-flag-enabled';
import { useQuery } from '@tanstack/react-query';
import { RouterOutput, useTRPC } from '@tet/api';

export type FicheSecteursAVerifier =
  RouterOutput['plans']['fiches']['listPlanFichesSecteursAVerifier'][number];

export const useListPlanFichesSecteursAVerifier = (
  collectiviteId: number,
  planId: number
) => {
  const trpc = useTRPC();
  const isEnabled = useIsFeatureFlagEnabled('is-fiche-secteurs-enabled');

  const { data } = useQuery(
    trpc.plans.fiches.listPlanFichesSecteursAVerifier.queryOptions(
      { collectiviteId, planId },
      { enabled: isEnabled }
    )
  );

  return data ?? [];
};
