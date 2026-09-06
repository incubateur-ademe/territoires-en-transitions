import { ENV } from '@tet/api/environmentVariables';
import { useActiveFeatureFlags } from 'posthog-js/react';
import { useMemo } from 'react';
import { listAvailableIndicateurPeriodiciteOptions } from './indicateur-period-presentation';

/**
 * Owns the browser rollout policy for periodicity choices. Forms only consume
 * the options they may display; they do not know about PostHog or environments.
 */
export const useAvailableIndicateurPeriodiciteOptions = () => {
  const activeFeatureFlags = useActiveFeatureFlags();
  const enableAllFeatureFlags =
    ENV.application_env === 'dev' || ENV.application_env === 'ci';

  return useMemo(
    () =>
      listAvailableIndicateurPeriodiciteOptions(
        (featureFlag) =>
          enableAllFeatureFlags || activeFeatureFlags.includes(featureFlag)
      ),
    [activeFeatureFlags, enableAllFeatureFlags]
  );
};
