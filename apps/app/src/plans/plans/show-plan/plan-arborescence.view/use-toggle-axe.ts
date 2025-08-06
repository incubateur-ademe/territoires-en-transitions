import { OPEN_AXES_KEY_SEARCH_PARAMETER } from '@/app/app/paths';
import { PlanNode } from '@/domain/plans/plans';
import { parseAsArrayOf, parseAsInteger, useQueryState } from 'nuqs';
import { getChildrenAxeIds } from './get-children-axe-ids';

export const useToggleAxe = (
  axeId: number,
  axes: PlanNode[]
): {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
} => {
  const [openAxes, setOpenAxes] = useQueryState(
    OPEN_AXES_KEY_SEARCH_PARAMETER,
    parseAsArrayOf(parseAsInteger).withDefault([])
  );

  const setIsOpen = (isOpen: boolean): void => {
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

  return { isOpen: openAxes.includes(axeId), setIsOpen };
};
