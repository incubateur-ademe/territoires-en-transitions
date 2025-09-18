import { useState } from 'react';

export const useFicheActionSelection = (currentPage: number) => {
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

  const isFicheSelected = (ficheId: number) => {
    if (selectedFicheIds === 'all') {
      return true;
    }
    return selectedFicheIds.includes(ficheId);
  };

  return {
    selectedFicheIds,
    handleSelectFiche,
    handleSelectAll,
    isSelectAllMode,
    isFicheSelected,
    isGroupedActionsModeActive,
    toggleGroupedActionsMode,
  };
};
