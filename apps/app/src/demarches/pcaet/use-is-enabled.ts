import { useIsFeatureFlagEnabled } from '@/app/utils/posthog/use-is-feature-flag-enabled';
import { useCollectiviteContext } from '@tet/api/collectivites';
import type { PermissionOperation } from '@tet/domain/users';

/**
 * PCAET is collectivité-scoped. On pages without a current collectivité
 * (e.g. `/finaliser-mon-inscription`), return false instead of calling
 * `useCurrentCollectivite()` which throws when collectivite is null.
 */
function useIsDemarchePcaetAllowed(
  anyOf: readonly PermissionOperation[]
): boolean {
  const { collectivite } = useCollectiviteContext();
  const featureFlagEnabled =
    useIsFeatureFlagEnabled('is-demarche-pcaet-enabled') ?? false;

  if (!collectivite) {
    return false;
  }

  return (
    featureFlagEnabled &&
    anyOf.some((permission) =>
      collectivite.hasCollectivitePermission(permission)
    )
  );
}

export function useIsDemarchePcaetEnabled(): boolean {
  return useIsDemarchePcaetAllowed(['demarches.pcaet.mutate']);
}

/**
 * Les démarches PCAET de la collectivité sont-elles consultables, en édition
 * ou en lecture publique ? Commande l'entrée du menu, que le visiteur et le
 * membre en lecture voient aussi.
 */
export function useCanReadDemarchesPcaet(): boolean {
  return useIsDemarchePcaetAllowed([
    'demarches.pcaet.mutate',
    'demarches.pcaet.read',
  ]);
}
