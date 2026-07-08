'use client';

import { isNewReferentiel } from '@tet/domain/referentiels';
import { Event, useEventTracker } from '@tet/ui';
import { usePostHog } from 'posthog-js/react';
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react';
import useLocalStorage from 'react-use/lib/useLocalStorage';
import { useReferentielId } from '../referentiel-context';

export type ReferentielThematiqueView = 'sgpe' | 'axes';

const STORAGE_KEY = 'tet_referentiel_thematique_view';

let lastSyncedReferentielThematiqueViewPersonProperty:
  | ReferentielThematiqueView
  | undefined;

type ReferentielThematiqueViewContextValue = {
  view: ReferentielThematiqueView;
  setView: (view: ReferentielThematiqueView) => void;
};

const ReferentielThematiqueViewContext =
  createContext<ReferentielThematiqueViewContextValue | null>(null);

export const ReferentielThematiqueViewProvider = ({
  children,
}: PropsWithChildren) => {
  const posthog = usePostHog();
  const trackEvent = useEventTracker();
  const [stored, setStored] = useLocalStorage<ReferentielThematiqueView>(
    STORAGE_KEY,
    'sgpe'
  );

  const view = stored ?? 'sgpe';

  useEffect(() => {
    if (
      !posthog ||
      lastSyncedReferentielThematiqueViewPersonProperty === view
    ) {
      return;
    }
    posthog.setPersonProperties({ referentiel_thematique_view: view });
    lastSyncedReferentielThematiqueViewPersonProperty = view;
  }, [posthog, view]);

  const setView = useCallback(
    (next: ReferentielThematiqueView) => {
      if (next !== view) {
        trackEvent(Event.referentiels.changeThematiqueView, {
          referentielThematiqueView: next,
          previousReferentielThematiqueView: view,
        });
      }
      setStored(next);
    },
    [view, setStored, trackEvent]
  );

  const value = useMemo<ReferentielThematiqueViewContextValue>(
    () => ({
      view,
      setView,
    }),
    [view, setView]
  );

  return (
    <ReferentielThematiqueViewContext.Provider value={value}>
      {children}
    </ReferentielThematiqueViewContext.Provider>
  );
};

const OLD_REFERENTIEL_VALUE: ReferentielThematiqueViewContextValue = {
  view: 'axes',
  setView: () => {},
};

export function useReferentielThematiqueView(): ReferentielThematiqueViewContextValue {
  const ctx = useContext(ReferentielThematiqueViewContext);
  if (!ctx) {
    throw new Error(
      'useReferentielThematiqueView doit être utilisé dans un ReferentielThematiqueViewProvider'
    );
  }

  const referentielId = useReferentielId();
  const isNew = isNewReferentiel(referentielId);

  if (!isNew) {
    return OLD_REFERENTIEL_VALUE;
  }

  return ctx;
}
