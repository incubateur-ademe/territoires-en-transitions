import type { FeatureFlagKey } from '../../utils/feature-flags';
import type { IndicateurPeriodicite } from './indicateur-periodicite.schema';

type IndicateurPeriodiciteRollout = Readonly<{
  activationFeatureFlag: FeatureFlagKey | null;
}>;

const rolloutByPeriodicite = Object.freeze({
  annuelle: { activationFeatureFlag: null },
  mensuelle: {
    activationFeatureFlag: 'is-indicateur-periodicite-mensuelle-enabled',
  },
}) satisfies Readonly<
  Record<IndicateurPeriodicite, IndicateurPeriodiciteRollout>
>;

/**
 * Operational activation is separate from calendar semantics: a cadence can
 * be understood by the code during an expand/contract rollout before users
 * are allowed to assign it to new definitions.
 */
export const getIndicateurPeriodiciteRollout = (
  periodicite: IndicateurPeriodicite
): IndicateurPeriodiciteRollout => rolloutByPeriodicite[periodicite];
