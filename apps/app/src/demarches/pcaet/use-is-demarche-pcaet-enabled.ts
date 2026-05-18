import { useIsFeatureFlagEnabled } from '@/app/utils/posthog/use-is-feature-flag-enabled';
import { useCurrentCollectivite } from '@tet/api/collectivites';

export function useIsDemarchePcaetEnabled(): boolean {
  const { hasCollectivitePermission } = useCurrentCollectivite();
  const hasMutatePermission = hasCollectivitePermission(
    'demarches.pcaet.mutate'
  );

  const featureFlagEnabled =
    useIsFeatureFlagEnabled('is-demarche-pcaet-enabled') ?? false;

  return featureFlagEnabled && hasMutatePermission;
}
