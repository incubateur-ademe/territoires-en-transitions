import { hasPermission } from '@/app/users/authorizations/permission-access-level.utils';
import { PermissionOperation } from '@tet/domain/users';
import { useState } from 'react';
import { FicheActionViewOptions } from './use-select-fiche-view';

export const useSelectFiches = ({
  view,
  currentPage,
  isReadOnly,
  permissions,
}: {
  view: FicheActionViewOptions;
  currentPage: number;
  isReadOnly: boolean;
  permissions: PermissionOperation[];
}) => {
  // TODO: to be improved with a more granular permission check > can export in pdf. But for now ok.
  const isGroupedActionsEnabled =
    !isReadOnly &&
    view !== 'scheduler' &&
    hasPermission(permissions, 'plans.fiches.bulk_update');

  const [previousPage, setPreviousPage] = useState(currentPage);
  const [isGroupedActionsModeActive, setIsGroupedActionsModeActive] =
    useState(false);

  const [selectedFicheIds, setSelectedFicheIds] = useState<number[] | 'all'>(
    []
  );

  const toggleGroupedActionsMode = (isActive: boolean) => {
    if (isActive === false) {
      resetSelection();
    }
    setIsGroupedActionsModeActive(isActive);
  };

  const isSelectAllMode =
    selectedFicheIds === 'all' && isGroupedActionsModeActive;

  const resetSelection = () => {
    setSelectedFicheIds([]);
  };

  if (previousPage !== currentPage && !isSelectAllMode) {
    setPreviousPage(currentPage);
  }

  const handleSelectFiche = (ficheId: number) => {
    const currentSelectedFicheIds =
      selectedFicheIds === 'all' ? [] : selectedFicheIds;

    if (currentSelectedFicheIds.includes(ficheId)) {
      setSelectedFicheIds(
        currentSelectedFicheIds.filter((id) => id !== ficheId)
      );
    } else {
      setSelectedFicheIds([...currentSelectedFicheIds, ficheId]);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    return checked ? setSelectedFicheIds('all') : resetSelection();
  };

  return {
    selectedFicheIds,
    handleSelectFiche,
    handleSelectAll,
    isSelectAllMode,
    isGroupedActionsModeActive,
    toggleGroupedActionsMode,
    isGroupedActionsEnabled,
  };
};
