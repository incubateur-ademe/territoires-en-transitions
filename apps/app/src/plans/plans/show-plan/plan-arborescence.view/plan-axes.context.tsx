'use client';

import { OPEN_AXES_KEY_SEARCH_PARAMETER } from '@/app/app/paths';
import { PlanNode } from '@tet/domain/plans';
import { parseAsArrayOf, parseAsInteger, useQueryState } from 'nuqs';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { getChildrenAxeIds } from './get-children-axe-ids';

type PlanAxesContextValue = {
  openAxes: number[];
  setIsOpen: (axeId: number, isOpen: boolean) => void;
  toggleAll: () => void;
  areAllClosed: boolean;
  isToggleAllActive: boolean;
};

const PlanAxesContext = createContext<PlanAxesContextValue | null>(null);

type PlanAxesProviderProps = {
  children: React.ReactNode;
  rootAxe: PlanNode | null | undefined;
  axes: PlanNode[];
};

export const PlanAxesProvider = ({
  children,
  rootAxe,
  axes,
}: PlanAxesProviderProps) => {
  const [openAxes, setOpenAxes] = useQueryState(
    OPEN_AXES_KEY_SEARCH_PARAMETER,
    parseAsArrayOf(parseAsInteger).withDefault([])
  );
  const [isToggleAllActive, setIsToggleAllActive] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const allAxeIds = rootAxe ? getChildrenAxeIds(rootAxe, axes) : [];
  const areAllClosed = openAxes.length === 0;

  // Nettoyer le flag après un court délai
  useEffect(() => {
    if (isToggleAllActive) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setIsToggleAllActive(false);
      }, 100);
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }
  }, [isToggleAllActive]);

  const setIsOpen = (axeId: number, isOpen: boolean): void => {
    let newAxeIds: number[];
    if (isOpen === true) {
      const isAxeAlreadyOpen = openAxes.includes(axeId);
      newAxeIds = isAxeAlreadyOpen ? openAxes : [...openAxes, axeId];
      setOpenAxes(newAxeIds);
      return;
    }

    const currentAxe = axes.find((axe) => axe.id === axeId);
    if (!currentAxe) return;

    const childrenAxeIds = getChildrenAxeIds(currentAxe, axes);
    const axesToRemove = [axeId, ...childrenAxeIds];

    newAxeIds = openAxes.filter((id: number) => !axesToRemove.includes(id));
    setOpenAxes(newAxeIds);
  };

  const toggleAll = () => {
    if (!rootAxe || allAxeIds.length === 0) {
      return;
    }
    if (areAllClosed) {
      // Tout déplier : ajouter tous les IDs d'axes
      // Activer le flag temporaire pour désactiver le scroll automatique
      setIsToggleAllActive(true);
      setOpenAxes(allAxeIds);
    } else {
      // Tout replier : retirer tous les IDs d'axes
      setOpenAxes([]);
    }
  };

  const value: PlanAxesContextValue = {
    openAxes,
    setIsOpen,
    toggleAll,
    areAllClosed,
    isToggleAllActive,
  };

  return (
    <PlanAxesContext.Provider value={value}>
      {children}
    </PlanAxesContext.Provider>
  );
};

export const usePlanAxesContext = () => {
  const context = useContext(PlanAxesContext);
  if (!context) {
    throw new Error(
      'usePlanAxesContext must be used within a PlanAxesProvider'
    );
  }
  return context;
};

