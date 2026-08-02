import { useIsFeatureFlagEnabled } from '@/app/utils/posthog/use-is-feature-flag-enabled';
import { useCollectiviteContext } from '@tet/api/collectivites';

/**
 * PCAET is collectivité-scoped. On pages without a current collectivité
 * (e.g. `/finaliser-mon-inscription`), return false instead of calling
 * `useCurrentCollectivite()` which throws when collectivite is null.
 */
export function useIsDemarchePcaetEnabled(): boolean {
  const { collectivite } = useCollectiviteContext();
  const featureFlagEnabled =
    useIsFeatureFlagEnabled('is-demarche-pcaet-enabled') ?? false;

  if (!collectivite) {
    return false;
  }

  return (
    featureFlagEnabled &&
    collectivite.hasCollectivitePermission('demarches.pcaet.mutate')
  );
}
