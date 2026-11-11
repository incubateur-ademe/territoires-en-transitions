import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getTrajectoireSnbc3FlagState,
  useIsTrajectoireSnbc3Enabled,
} from './use-is-trajectoire-snbc3-enabled';

const COLLECTIVITE_ID = 4322;

const env = vi.hoisted(() => ({ application_env: 'prod' }));
vi.mock('@tet/api/environmentVariables', () => ({ ENV: env }));
vi.mock('@tet/api/collectivites', () => ({
  useCollectiviteId: (): number => COLLECTIVITE_ID,
}));

/** Faux client PostHog : `loadFlags` simule la réception des flags. */
const posthogMock = vi.hoisted(() => {
  const handlers = new Set<() => void>();
  const state = {
    client: undefined as unknown,
    groups: {} as Record<string, string>,
    flag: undefined as boolean | undefined,
    flagsLoaded: false,
  };
  /** état interne de rechargement lu par `isFlagsReloadPending` */
  const featureFlags = { _additionalReloadRequested: false };
  const client = {
    __loaded: true,
    featureFlags,
    getGroups: () => state.groups,
    onFeatureFlags: (handler: () => void) => {
      handlers.add(handler);
      if (state.flagsLoaded) handler();
      return () => handlers.delete(handler);
    },
  };
  const loadFlags = (groups: Record<string, string>, flag: boolean) => {
    state.groups = groups;
    state.flag = flag;
    state.flagsLoaded = true;
    handlers.forEach((handler) => handler());
  };
  return { state, client, featureFlags, handlers, loadFlags };
});
vi.mock('posthog-js/react', () => ({
  usePostHog: () => posthogMock.state.client,
  useFeatureFlagEnabled: () => posthogMock.state.flag,
}));

const currentGroup = { collectivite: String(COLLECTIVITE_ID) };
const otherGroup = { collectivite: '1' };

beforeEach(() => {
  env.application_env = 'prod';
  posthogMock.handlers.clear();
  posthogMock.featureFlags._additionalReloadRequested = false;
  Object.assign(posthogMock.state, {
    client: posthogMock.client,
    groups: {},
    flag: undefined,
    flagsLoaded: false,
  });
});

describe('useIsTrajectoireSnbc3Enabled', () => {
  it.each(['dev', 'ci'])('est toujours actif en %s', (applicationEnv) => {
    env.application_env = applicationEnv;
    posthogMock.state.client = undefined;

    const { result } = renderHook(() => useIsTrajectoireSnbc3Enabled());

    expect(result.current).toBe(true);
  });

  it('est inactif sans client PostHog', () => {
    posthogMock.state.client = undefined;

    const { result } = renderHook(() => useIsTrajectoireSnbc3Enabled());

    expect(result.current).toBe(false);
  });

  it('reste inconnu tant que les flags ne sont pas chargés', () => {
    const { result } = renderHook(() => useIsTrajectoireSnbc3Enabled());

    expect(result.current).toBeUndefined();
  });

  it("reste inconnu avec des flags chargés pour une autre collectivité, jusqu'au rechargement", () => {
    posthogMock.loadFlags(otherGroup, false);

    const { result } = renderHook(() => useIsTrajectoireSnbc3Enabled());
    expect(result.current).toBeUndefined();

    act(() => posthogMock.loadFlags(currentGroup, true));
    expect(result.current).toBe(true);
  });

  it("ignore la réponse de l'ancien groupe reçue après le changement de groupe", () => {
    posthogMock.loadFlags(otherGroup, false);
    const { result } = renderHook(() => useIsTrajectoireSnbc3Enabled());

    // `posthog.group` pendant une requête : PostHog relancera après la réponse,
    // qui arrive alors avec le nouveau groupe et les flags de l'ancien
    posthogMock.featureFlags._additionalReloadRequested = true;
    act(() => posthogMock.loadFlags(currentGroup, false));
    expect(result.current).toBeUndefined();

    posthogMock.featureFlags._additionalReloadRequested = false;
    act(() => posthogMock.loadFlags(currentGroup, true));
    expect(result.current).toBe(true);
  });

  it.each([true, false])(
    'renvoie le flag (%s) chargé pour la collectivité courante',
    (flag) => {
      posthogMock.loadFlags(currentGroup, flag);

      const { result } = renderHook(() => useIsTrajectoireSnbc3Enabled());

      expect(result.current).toBe(flag);
    }
  );
});

describe('getTrajectoireSnbc3FlagState', () => {
  const base = {
    isForced: false,
    hasClient: true,
    collectiviteId: COLLECTIVITE_ID,
    flag: true,
  };

  it('ignore un flag évalué pour un autre groupe ou sans groupe', () => {
    expect(
      getTrajectoireSnbc3FlagState({ ...base, flagsEvaluatedFor: '1' })
    ).toBeUndefined();
    expect(
      getTrajectoireSnbc3FlagState({ ...base, flagsEvaluatedFor: undefined })
    ).toBeUndefined();
  });

  it('traite un flag absent comme inactif une fois les flags chargés', () => {
    expect(
      getTrajectoireSnbc3FlagState({
        ...base,
        flag: undefined,
        flagsEvaluatedFor: String(COLLECTIVITE_ID),
      })
    ).toBe(false);
  });
});
