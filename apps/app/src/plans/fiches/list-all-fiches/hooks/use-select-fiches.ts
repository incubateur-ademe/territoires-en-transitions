import { useState } from 'react';
import { FicheActionViewOptions } from './use-select-fiche-view';

export const useSelectFiches = ({
  view,
  currentPage,
  isReadOnly,
}: {
  view: FicheActionViewOptions;
  currentPage: number;
  isReadOnly: boolean;
}) => {
  const isGroupedActionsEnabled = !isReadOnly && view !== 'scheduler';

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
