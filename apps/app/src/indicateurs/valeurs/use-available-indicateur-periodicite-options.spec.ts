import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAvailableIndicateurPeriodiciteOptions } from './use-available-indicateur-periodicite-options';

const state = vi.hoisted(() => ({
  applicationEnv: { value: 'prod' },
  activeFeatureFlags: { value: [] as string[] },
}));

vi.mock('@tet/api/environmentVariables', () => ({
  ENV: {
    get application_env() {
      return state.applicationEnv.value;
    },
  },
}));

vi.mock('posthog-js/react', () => ({
  useActiveFeatureFlags: () => state.activeFeatureFlags.value,
}));

const listValues = () =>
  renderHook(() =>
    useAvailableIndicateurPeriodiciteOptions()
  ).result.current.map(({ value }) => value);

describe('useAvailableIndicateurPeriodiciteOptions', () => {
  beforeEach(() => {
    state.applicationEnv.value = 'prod';
    state.activeFeatureFlags.value = [];
  });

  it('masque la périodicité mensuelle en production sans activation', () => {
    expect(listValues()).toEqual(['annuelle']);
  });

  it('affiche la périodicité mensuelle quand sa feature flag est active', () => {
    state.activeFeatureFlags.value = [
      'is-indicateur-periodicite-mensuelle-enabled',
    ];

    expect(listValues()).toEqual(['annuelle', 'mensuelle']);
  });

  it('active toutes les périodicités disponibles en développement', () => {
    state.applicationEnv.value = 'dev';

    expect(listValues()).toEqual(['annuelle', 'mensuelle']);
  });
});
