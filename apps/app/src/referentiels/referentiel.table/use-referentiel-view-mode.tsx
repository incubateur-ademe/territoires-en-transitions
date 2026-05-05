'use client';

import { createContext, PropsWithChildren, useContext, useMemo } from 'react';
import useLocalStorage from 'react-use/lib/useLocalStorage';

const STORAGE_KEY = 'tet_referentiel_view_mode';

export type ReferentielViewMode = 'legacy' | 'table';

type ReferentielViewModeContextValue = {
  mode: ReferentielViewMode;
  setMode: (mode: ReferentielViewMode) => void;
};

const ReferentielViewModeContext =
  createContext<ReferentielViewModeContextValue | null>(null);

export const ReferentielViewModeProvider = ({
  children,
}: PropsWithChildren) => {
  const [stored, setStored] = useLocalStorage<ReferentielViewMode>(
    STORAGE_KEY,
    'legacy'
  );

  const value = useMemo<ReferentielViewModeContextValue>(
    () => ({
      mode: stored ?? 'legacy',
      setMode: (next) => setStored(next),
    }),
    [stored, setStored]
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
