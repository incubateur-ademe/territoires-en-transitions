'use client';

import { OPEN_AXES_KEY_SEARCH_PARAMETER } from '@/app/app/paths';
import { hasPermission } from '@/app/users/authorizations/permission-access-level.utils';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Plan, PlanNode } from '@tet/domain/plans';
import { CollectiviteAccess } from '@tet/domain/users';
import { parseAsArrayOf, parseAsInteger, useQueryState } from 'nuqs';
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { checkAxeHasFiche } from '../../utils';
import { useUpdatePlan } from '../data/use-update-plan';
import { usePlanFilters } from '../filters/plan-filters.context';
import { getChildrenAxeIds } from './get-children-axe-ids';
import { PlanDisplayOptionsEnum, usePlanOptions } from './plan-options.context';

type PlanAxesContextValue = {
  collectivite: CollectiviteAccess;
  plan: Plan;
  updatePlan: ReturnType<typeof useUpdatePlan>['mutate'];
  rootAxe: PlanNode;
  openAxes: number[];
  setIsOpen: (axeId: number, isOpen: boolean) => void;
  toggleAll: () => void;
  areAllClosed: boolean;
  hasAxesToExpand: boolean;
  isReadOnly: boolean;
  isToggleAllActive: boolean;
  isActionsVisible: boolean;
  isFiltered: boolean;
  isPlanEmpty: boolean;
  axeHasFiches: boolean;
};

const PlanAxesContext = createContext<PlanAxesContextValue | null>(null);

type PlanAxesProviderProps = {
  children: React.ReactNode;
  plan: Plan;
  rootAxe: PlanNode;
};

export const PlanAxesProvider = ({
  children,
  plan,
  rootAxe,
}: PlanAxesProviderProps) => {
  const collectivite = useCurrentCollectivite();
  const { mutate: updatePlan } = useUpdatePlan({
    collectiviteId: collectivite.collectiviteId,
  });

  const [openAxes, setOpenAxes] = useQueryState(
    OPEN_AXES_KEY_SEARCH_PARAMETER,
    parseAsArrayOf(parseAsInteger).withDefault([])
  );
  const [isToggleAllActive, setIsToggleAllActive] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const axes = plan.axes;
  const hasAxesToExpand = axes.some((axe) => axe.depth > 0) || false;
  const axeHasFiches = rootAxe ? checkAxeHasFiche(rootAxe, plan.axes) : false;

  const hasFiches = rootAxe?.fiches && rootAxe.fiches.length > 0;
  const hasAxes = plan.axes.some((axe) => axe.depth > 0);
  const isPlanEmpty = !hasFiches && !hasAxes;

  const allAxeIds = rootAxe ? getChildrenAxeIds(rootAxe, axes) : [];
  const areAllClosed = openAxes.length === 0;
  const isReadOnly =
    collectivite.isReadOnly ||
    !hasPermission(collectivite.permissions, 'plans.mutate');

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

  const planOptions = usePlanOptions();
  const isActionsVisible = planOptions.isOptionEnabled(
    PlanDisplayOptionsEnum.ACTIONS
  );

  const { isFiltered } = usePlanFilters();

  const value: PlanAxesContextValue = {
    collectivite,
    isReadOnly,
    plan,
    updatePlan,
    rootAxe,
    hasAxesToExpand,
    openAxes,
    setIsOpen,
    toggleAll,
    areAllClosed,
    isToggleAllActive,
    isActionsVisible,
    isFiltered,
    isPlanEmpty,
    axeHasFiches,
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
