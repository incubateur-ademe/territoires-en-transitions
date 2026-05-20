'use client';

import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react';
import { Event, useEventTracker } from '@tet/ui';
import useLocalStorage from 'react-use/lib/useLocalStorage';
import { usePostHog } from 'posthog-js/react';

export type ReferentielViewMode = 'legacy' | 'table';

const STORAGE_KEY = 'tet_referentiel_view_mode';

/** Dernière valeur envoyée à PostHog (person properties), pour éviter un appel à chaque remontage du provider. */
let lastSyncedReferentielViewModePersonProperty:
  | ReferentielViewMode
  | undefined;

type ReferentielViewModeContextValue = {
  mode: ReferentielViewMode;
  setMode: (mode: ReferentielViewMode) => void;
};

const ReferentielViewModeContext =
  createContext<ReferentielViewModeContextValue | null>(null);

export const ReferentielViewModeProvider = ({
  children,
}: PropsWithChildren) => {
  const posthog = usePostHog();
  const trackEvent = useEventTracker();
  const [stored, setStored] = useLocalStorage<ReferentielViewMode>(
    STORAGE_KEY,
    'legacy'
  );

  const mode = stored ?? 'legacy';

  useEffect(() => {
    if (
      !posthog ||
      lastSyncedReferentielViewModePersonProperty === mode
    ) {
      return;
    }
    posthog.setPersonProperties({ referentiel_view_mode: mode });
    lastSyncedReferentielViewModePersonProperty = mode;
  }, [posthog, mode]);

  const setMode = useCallback(
    (next: ReferentielViewMode) => {
      if (next !== mode) {
        trackEvent(Event.referentiels.changeViewMode, {
          referentielViewMode: next,
          previousReferentielViewMode: mode,
        });
      }
      setStored(next);
    },
    [mode, setStored, trackEvent]
  );

  const value = useMemo<ReferentielViewModeContextValue>(
    () => ({
      mode,
      setMode,
    }),
    [mode, setMode]
  );

  return (
    <ReferentielViewModeContext.Provider value={value}>
      {children}
    </ReferentielViewModeContext.Provider>
  );
};

export function useReferentielViewMode() {
  const ctx = useContext(ReferentielViewModeContext);
  if (!ctx) {
    throw new Error(
      'useReferentielViewMode doit être utilisé dans un ReferentielViewModeProvider'
    );
  }
  return ctx;
}
