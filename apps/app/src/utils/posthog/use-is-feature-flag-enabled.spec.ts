import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  useFeatureFlagState,
  useIsFeatureFlagEnabled,
} from './use-is-feature-flag-enabled';

const FLAG = 'is-trajectoire-snbc3-enabled';

const env = vi.hoisted(() => ({ application_env: 'prod' }));
vi.mock('@tet/api/environmentVariables', () => ({ ENV: env }));

const state = vi.hoisted(() => ({
  user: { id: 'user-1' } as { id: string } | null,
  query: { data: undefined, isError: false } as {
    data: Record<string, boolean> | undefined;
    isError: boolean;
  },
  enabled: undefined as boolean | undefined,
}));
vi.mock('@tet/api/users', () => ({
  useUserContext: () => ({ user: state.user }),
}));
vi.mock('./use-list-feature-flags', () => ({
  useListFeatureFlags: ({ enabled }: { enabled: boolean }) => {
    state.enabled = enabled;
    return state.query;
  },
}));

const renderState = () =>
  renderHook(() => useFeatureFlagState(FLAG)).result.current;

describe('useFeatureFlagState', () => {
  beforeEach(() => {
    env.application_env = 'prod';
    state.user = { id: 'user-1' };
    state.query = { data: undefined, isError: false };
    state.enabled = undefined;
  });

  it.each(['dev', 'ci'])(
    'est actif en %s, sans appel au backend',
    (applicationEnv) => {
      env.application_env = applicationEnv;
      state.query = { data: { [FLAG]: false }, isError: false };

      expect(renderState()).toBe(true);
      expect(state.enabled).toBe(false);
    }
  );

  it('est inactif sans session', () => {
    state.user = null;

    expect(renderState()).toBe(false);
  });

  it("n'est pas connu tant que les flags ne sont pas chargés", () => {
    expect(renderState()).toBeUndefined();
    expect(state.enabled).toBe(true);
  });

  it('prend la valeur renvoyée par le backend', () => {
    state.query = { data: { [FLAG]: true }, isError: false };
    expect(renderState()).toBe(true);

    state.query = { data: { [FLAG]: false }, isError: false };
    expect(renderState()).toBe(false);
  });

  it('est inactif si le backend ne renvoie pas les flags', () => {
    state.query = { data: undefined, isError: true };

    expect(renderState()).toBe(false);
  });

  it("garde les flags déjà chargés si un rechargement échoue", () => {
    state.query = { data: { [FLAG]: true }, isError: true };

    expect(renderState()).toBe(true);
  });
});

describe('useIsFeatureFlagEnabled', () => {
  beforeEach(() => {
    env.application_env = 'prod';
    state.user = { id: 'user-1' };
    state.query = { data: undefined, isError: false };
  });

  it("est inactif tant que le flag n'est pas connu", () => {
    expect(renderHook(() => useIsFeatureFlagEnabled(FLAG)).result.current).toBe(
      false
    );
  });
});
