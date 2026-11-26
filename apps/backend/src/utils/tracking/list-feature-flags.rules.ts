import { FEATURE_FLAGS } from '@tet/domain/utils';
import type { FeatureFlags } from './event-tracker.interface';

/** Tous les flags connus à la même valeur. */
export function buildUniformFeatureFlags(value: boolean): FeatureFlags {
  return Object.fromEntries(
    FEATURE_FLAGS.map((key) => [key, value])
  ) as FeatureFlags;
}

/**
 * Ramène la réponse de PostHog aux seuls flags connus de l'application, en
 * booléens. Comme `isFeatureEnabled` de posthog-node, un variant (chaîne) vaut
 * actif ; un flag absent de la réponse vaut inactif.
 */
export function toFeatureFlags(
  values: Record<string, string | boolean> | undefined
): FeatureFlags {
  return Object.fromEntries(
    FEATURE_FLAGS.map((key) => {
      const value = values?.[key];
      return [key, value !== undefined && value !== false];
    })
  ) as FeatureFlags;
}
