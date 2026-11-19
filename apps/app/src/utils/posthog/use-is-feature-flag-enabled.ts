import { ENV } from '@tet/api/environmentVariables';
import { useUserContext } from '@tet/api/users';
import { FeatureFlagKey } from '@tet/domain/utils';
import { useListFeatureFlags } from './use-list-feature-flags';

/**
 * État d'un feature flag pour l'utilisateur et la collectivité courante :
 * `undefined` tant qu'il n'est pas connu, `false` sans session.
 *
 * Inactif si le backend n'a pas pu renvoyer les flags, comme quand PostHog
 * échoue côté serveur : sans ce repli, un appelant qui attend que le flag soit
 * connu attendrait indéfiniment.
 *
 * Toujours actif en dev et en CI, sans appel au backend.
 */
export function useFeatureFlagState(
  featureFlagKey: FeatureFlagKey
): boolean | undefined {
  const isForced =
    ENV.application_env === 'dev' || ENV.application_env === 'ci';
  const { user } = useUserContext();
  const { data, isError } = useListFeatureFlags({ enabled: !isForced });

  if (isForced) {
    return true;
  }
  if (user === null) {
    return false;
  }
  if (data === undefined && isError) {
    return false;
  }
  return data?.[featureFlagKey];
}

/** Comme `useFeatureFlagState`, inactif tant que le flag n'est pas connu. */
export function useIsFeatureFlagEnabled(featureFlagKey: FeatureFlagKey) {
  return useFeatureFlagState(featureFlagKey) ?? false;
}
