import { FeatureFlagKey } from '@tet/domain/utils';

export interface EventTracker {
  capture(params: {
    distinctId: string;
    event: string;
    properties?: Record<string, string | number | boolean | undefined>;
  }): void;

  isEnabled(): boolean;

  isFeatureEnabled(
    featureFlagKey: FeatureFlagKey,
    userId: string,
    collectiviteId?: number
  ): Promise<boolean>;

  shutdown(): Promise<void>;
}
