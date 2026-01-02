import { OPEN_AXES_KEY_SEARCH_PARAMETER } from '@/app/app/paths';
import { PlanNode } from '@tet/domain/plans';
import { parseAsArrayOf, parseAsInteger, useQueryState } from 'nuqs';
import { getChildrenAxeIds } from './get-children-axe-ids';

/**
 * Hook pour gérer le dépliage/repliage de tous les axes d'un plan
 */
export const useToggleAllAxes = (
  rootAxe: PlanNode | null | undefined,
  axes: PlanNode[]
) => {
  const [openAxes, setOpenAxes] = useQueryState(
    OPEN_AXES_KEY_SEARCH_PARAMETER,
    parseAsArrayOf(parseAsInteger).withDefault([])
  );

  const allAxeIds = rootAxe ? getChildrenAxeIds(rootAxe, axes) : [];
  const areAllClosed = openAxes.length === 0;

  const toggleAll = () => {
    if (!rootAxe || allAxeIds.length === 0) {
      return;
    }
    if (areAllClosed) {
      // Tout déplier : ajouter tous les IDs d'axes
      setOpenAxes(allAxeIds);
    } else {
      // Tout replier : retirer tous les IDs d'axes
      setOpenAxes([]);
    }
  };

  return {
    areAllClosed,
    toggleAll,
  };
};
