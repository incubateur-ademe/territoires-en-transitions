
import { useEffect, useState } from 'react';

export const useFicheActionSelection = (
  ficheResumes: any,
  currentPage: number,
) => {
  const [selectedFicheIds, setSelectedFicheIds] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState<boolean>(false);

  const handleSelectFiche = (ficheId: number) => {
    if (selectedFicheIds.includes(ficheId)) {
      setSelectedFicheIds(selectedFicheIds.filter((id) => id !== ficheId));
    } else {
      setSelectedFicheIds([...selectedFicheIds, ficheId]);
    }
  };

  const handleSelectAll = (checked: boolean, isAdmin?: boolean) => {
    if (checked) {
      setSelectedFicheIds(
        (isAdmin ? (ficheResumes.allIds) : ficheResumes.allIdsIAmPilote) || []
      );
      setSelectAll(true);
    } else {
      setSelectedFicheIds([]);
      setSelectAll(false);
    }
  };

  const resetSelection = () => {
    setSelectedFicheIds([]);
  };

  // Reset selection when page changes
  useEffect(() => {
    resetSelection();
  }, [currentPage]);

  return {
    selectedFicheIds,
    handleSelectFiche,
    handleSelectAll,
    resetSelection,
    selectAll
  };
};
