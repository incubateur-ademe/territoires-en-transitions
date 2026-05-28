'use client';

import { toggleArrayValue } from '@/app/utils/toggle-array-value';
import { useQueryStates } from 'nuqs';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { openedThematiquesUrlKeys } from '../filters/personnalisation-search-params-mapper';
import { openedThematiquesSearchParamsParser } from '../filters/personnalisation-search-params-parsers';

type OpenedThematiquesContextValue = {
  openedThematiques: string[];
  shouldAutoOpen: boolean;
  setOpenedThematiques: (thematiqueIds: string[]) => Promise<void>;
  openAllThematiques: (thematiqueIds: readonly string[]) => Promise<void>;
  isOpenThematique: (thematiqueId: string) => boolean;
  openThematique: (thematiqueId: string, open?: boolean) => void;
};

const OpenedThematiquesContext =
  createContext<OpenedThematiquesContextValue | null>(null);

function useOpenedThematiquesState(): OpenedThematiquesContextValue {
  const [searchParams, setSearchParams] = useQueryStates(
    openedThematiquesSearchParamsParser,
    { urlKeys: openedThematiquesUrlKeys }
  );

  const openedThematiques = searchParams.openedThematiques;
  const shouldAutoOpen = searchParams.autoOpenThematiques;

  const setOpenedThematiques = useCallback(
    async (thematiqueIds: string[]) => {
      await setSearchParams({
        openedThematiques: Array.from(new Set(thematiqueIds)),
      });
    },
    [setSearchParams]
  );

  const openAllThematiques = useCallback(
    async (thematiqueIds: readonly string[]) => {
      await setSearchParams({
        openedThematiques: Array.from(new Set(thematiqueIds)),
        autoOpenThematiques: null,
      });
    },
    [setSearchParams]
  );

  const isOpenThematique = useCallback(
    (thematiqueId: string) => openedThematiques.includes(thematiqueId),
    [openedThematiques]
  );

  const openThematique = useCallback(
    (thematiqueId: string, open = true) => {
      setSearchParams((prev) => toggleArrayValue(prev, thematiqueId, open));
    },
    [openedThematiques, setSearchParams]
  );

  return useMemo(
    () => ({
      openedThematiques,
      shouldAutoOpen,
      setOpenedThematiques,
      openAllThematiques,
      isOpenThematique,
      openThematique,
    }),
    [
      openedThematiques,
      shouldAutoOpen,
      setOpenedThematiques,
      openAllThematiques,
      isOpenThematique,
      openThematique,
    ]
  );
}

export function OpenedThematiquesProvider({
  children,
}: {
  children: ReactNode;
}) {
  const value = useOpenedThematiquesState();

  return (
    <OpenedThematiquesContext.Provider value={value}>
      {children}
    </OpenedThematiquesContext.Provider>
  );
}

export function useListOpenedThematiques() {
  const context = useContext(OpenedThematiquesContext);
  if (!context) {
    throw new Error(
      'useListOpenedThematiques must be used within an OpenedThematiquesProvider'
    );
  }
  return context;
}

type OpenAllThematiques = {
  shouldOpenAll: boolean;
  thematiques: readonly { id: string }[] | undefined;
  openThematiques: (ids: readonly string[]) => Promise<void>;
};

export function useOpenAllThematiques({
  shouldOpenAll,
  thematiques,
  openThematiques,
}: OpenAllThematiques) {
  const isDone = useRef(false);

  useEffect(() => {
    const cancelled = { value: false };

    const cleanup = () => {
      cancelled.value = true;
    };

    if (!shouldOpenAll) {
      isDone.current = false;
      return cleanup;
    }

    if (isDone.current || !thematiques?.length) {
      return cleanup;
    }

    isDone.current = true;

    void (async () => {
      try {
        await openThematiques(thematiques.map((thematique) => thematique.id));
      } catch {
        if (!cancelled.value) {
          isDone.current = false;
        }
      }
    })();

    return cleanup;
  }, [shouldOpenAll, thematiques, openThematiques]);
}
