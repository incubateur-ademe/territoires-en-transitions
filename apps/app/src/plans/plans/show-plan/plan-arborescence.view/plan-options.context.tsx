'use client';

import { PLAN_DISPLAY_OPTIONS_PARAMETER } from '@/app/app/paths';
import { createEnumObject } from '@tet/domain/utils';
import { parseAsArrayOf, parseAsStringLiteral, useQueryState } from 'nuqs';
import { createContext, ReactNode, useContext } from 'react';

export const PLAN_DISPLAY_OPTIONS = [
  'description',
  'indicateurs',
  'graphique_indicateurs',
  'actions',
] as const;

export const PlanDisplayOptionsEnum = createEnumObject(PLAN_DISPLAY_OPTIONS);

export type PlanDisplayOption = (typeof PLAN_DISPLAY_OPTIONS)[number];

type PlanOptionsContextType = {
  enabledOptions: Set<PlanDisplayOption>;
  toggleOption: (option: PlanDisplayOption) => void;
  isOptionEnabled: (option: PlanDisplayOption) => boolean;
};

const PlanOptionsContext = createContext<PlanOptionsContextType | null>(null);

export const PlanOptionsProvider = ({ children }: { children: ReactNode }) => {
  // conserve les options dans l'url
  const [enabledOptions, setEnabledOptions] = useQueryState(
    PLAN_DISPLAY_OPTIONS_PARAMETER,
    parseAsArrayOf(parseAsStringLiteral(PLAN_DISPLAY_OPTIONS)).withDefault([
      // par défaut toutes les options sont activées
      ...PLAN_DISPLAY_OPTIONS,
    ])
  );
  const currentOptions = new Set(enabledOptions);

  const toggleOption = (option: PlanDisplayOption) => {
    setEnabledOptions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(option)) {
        newSet.delete(option);
      } else {
        newSet.add(option);
      }
      return Array.from(newSet);
    });
  };

  const isOptionEnabled = (option: PlanDisplayOption) => {
    return currentOptions.has(option);
  };

  return (
    <PlanOptionsContext.Provider
      value={{
        enabledOptions: currentOptions,
        toggleOption,
        isOptionEnabled,
      }}
    >
      {children}
    </PlanOptionsContext.Provider>
  );
};

export const usePlanOptions = () => {
  const context = useContext(PlanOptionsContext);
  if (!context) {
    throw new Error('usePlanOptions must be used within a PlanOptionsProvider');
  }
  return context;
};
