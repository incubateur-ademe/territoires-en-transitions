import { FeatureFlagKey } from '@tet/domain/utils';

export type TrackedEventPropertyValue =
  | string
  | number
  | boolean
  | string[]
  | null
  | undefined;

export type TrackedEvent = {
  distinctId: string;
  event: string;
  properties?: Record<string, TrackedEventPropertyValue>;
  /**
   * Groupes PostHog de l'événement, par type de groupe. Sans `collectivite`, un
   * événement serveur ne se croise pas avec les propriétés de la collectivité
   * (type, région, population) synchronisées chaque nuit sur le groupe.
   */
  groups?: Record<string, string>;
};

export type FeatureFlagEvaluationOptions = {
  /** Exige un flag actif dans PostHog, sans activation automatique en dev/test/CI. */
  requireExplicitActivation?: boolean;
};

export interface EventTracker {
  capture(params: TrackedEvent): void;

  isEnabled(): boolean;

  isFeatureEnabled(
    featureFlagKey: FeatureFlagKey,
    userId: string,
    collectiviteId?: number,
    options?: FeatureFlagEvaluationOptions
  ): Promise<boolean>;

  shutdown(): Promise<void>;
}
