import { useSuperAdminMode } from '@/app/users/authorizations/super-admin-mode/super-admin-mode.provider';
import { useIsFeatureFlagEnabled } from '@/app/utils/posthog/use-is-feature-flag-enabled';
import { useCollectiviteContext } from '@tet/api/collectivites';

/**
 * Le super-admin garde l'accès hors flag : c'est lui qui rattrape les imports
 * pendant la Bêta.
 */
export function useIsAiPlanImportEnabled(): boolean {
  const { isSuperAdminRoleEnabled } = useSuperAdminMode();
  const { collectivite } = useCollectiviteContext();
  const featureFlagEnabled =
    useIsFeatureFlagEnabled('is-ai-plan-import-enabled') ?? false;

  if (isSuperAdminRoleEnabled) {
    return true;
  }

  return (
    featureFlagEnabled &&
    (collectivite?.hasCollectivitePermission('plans.fiches.import') ?? false)
  );
}
