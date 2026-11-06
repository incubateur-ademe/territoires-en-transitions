import { useIsFeatureFlagEnabled } from '@/app/utils/posthog/use-is-feature-flag-enabled';
import { useQuery } from '@tanstack/react-query';
import { RouterOutput, useTRPC } from '@tet/api';

export type FicheSecteursAVerifier =
  RouterOutput['plans']['fiches']['listPlanFichesSecteursAVerifier'][number];

export const useListPlanFichesSecteursAVerifier = (
  collectiviteId: number,
  planId: number,
  { enabled = true }: { enabled?: boolean } = {}
) => {
  const trpc = useTRPC();
  const isEnabled = useIsFeatureFlagEnabled('is-fiche-secteurs-enabled');

  const { data, isPending, isError } = useQuery(
    trpc.plans.fiches.listPlanFichesSecteursAVerifier.queryOptions(
      // Les fiches attribuées aussi : les cartes du plan affichent leurs
      // secteurs. Une seule requête, que le panneau rafraîchit en enregistrant.
      { collectiviteId, planId, includeAttribues: true },
      { enabled: isEnabled && enabled }
    )
  );

  return { isEnabled, fiches: data ?? [], isPending, isError };
};
