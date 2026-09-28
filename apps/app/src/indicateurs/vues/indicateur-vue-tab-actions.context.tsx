'use client';

import { createContext, ReactNode, useContext, useState } from 'react';
import { IndicateurVue } from './data/use-indicateur-vues';

type CurrentVueTabActions = {
  vue: IndicateurVue;
  openFilters: () => void;
  restoreFilters: () => void;
};

type ContextValue = {
  currentVueTabActions: CurrentVueTabActions | null;
  setCurrentVueTabActions: (value: CurrentVueTabActions | null) => void;
};

const Context = createContext<ContextValue | null>(null);

export function IndicateurVueTabActionsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [currentVueTabActions, setCurrentVueTabActions] =
    useState<CurrentVueTabActions | null>(null);

  return (
    <Context.Provider value={{ currentVueTabActions, setCurrentVueTabActions }}>
      {children}
    </Context.Provider>
  );
}

export function useIndicateurVueTabActionsContext() {
  const context = useContext(Context);

  if (!context) {
    throw new Error(
      'useIndicateurVueTabActionsContext must be used within IndicateurVueTabActionsProvider'
    );
  }

  return context;
}
