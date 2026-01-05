import { PlanNode } from '@tet/domain/plans';
import { groupBy, maxBy } from 'es-toolkit';
import React, { useState } from 'react';
import { usePlanAxesContext } from './plan-axes.context';

function findAxesWithUniqueDepth(
  groupedAxes: Record<number, PlanNode[]>
): PlanNode[] {
  const uniqueDepthGroups = Object.values(groupedAxes).filter(
    (group) => group.length === 1
  );
  return uniqueDepthGroups.flat();
}

export function findAxeWithUniqDepth(axes: PlanNode[]): PlanNode | undefined {
  const childAxes = axes.filter((axe) => axe.depth > 0);
  const groupedAxes = groupBy(childAxes, (axe) => axe.depth);
  const uniqueDepthAxes = findAxesWithUniqueDepth(groupedAxes);

  if (uniqueDepthAxes.length === 0) {
    return undefined;
  }

  const deepestAxe = maxBy(uniqueDepthAxes, (axe) => axe.depth);

  if (!deepestAxe || deepestAxe.depth === 0) {
    return undefined;
  }
  return deepestAxe;
}

export function getCanBeScrolledTo(
  axeId: number,
  axes: PlanNode[],
  openAxes: number[]
): boolean {
  const openAxesNodes = openAxes
    .map((id) => axes.find((axe) => axe.id === id))
    .filter((axe) => axe !== undefined);
  const leastDeepParentAxe = findAxeWithUniqDepth(openAxesNodes);
  const isCurrentAxeCommonAncestor =
    leastDeepParentAxe !== undefined && axeId === leastDeepParentAxe.id;
  /**
   * It's relevant to scroll to an axe only when it is the least deep common ancestor
   * ex:
   *  Axe 4: (this one should be scrolled to)
   *     Axe 4.1 (closed)
   *     Axe 4.2 (open)
   *       Axe 4.2.1 (open)
   *     Axe 4.3 (open)
   */
  return isCurrentAxeCommonAncestor;
}

export const useToggleAxe = (
  axeId: number,
  axes: PlanNode[]
): {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  shouldScroll: boolean;
} => {
  const [firstRender, setFirstRender] = useState(true);
  const {
    openAxes,
    setIsOpen: setIsOpenInContext,
    isToggleAllActive,
  } = usePlanAxesContext();

  const [shouldScroll, setShouldScroll] = useState(false);

  const setIsOpen = (isOpen: boolean): void => {
    setIsOpenInContext(axeId, isOpen);
  };

  const isAxeOpen = openAxes.includes(axeId);

  React.useEffect(() => {
    if (firstRender === false) {
      return;
    }
    const canBeScrolledTo = getCanBeScrolledTo(axeId, axes, openAxes);
    // Désactiver le scroll si un toggle global vient d'avoir lieu
    setShouldScroll(isAxeOpen && canBeScrolledTo && !isToggleAllActive);
    setFirstRender(false);
  }, [axeId, axes, firstRender, isAxeOpen, openAxes, isToggleAllActive]);

  return {
    isOpen: isAxeOpen,
    setIsOpen,
    shouldScroll,
  };
};
