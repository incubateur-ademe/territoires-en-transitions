import { useEffect, useState } from 'react';

export const useFicheActionSelection = (
  ficheResumes: any,
  currentPage: number
) => {
  const [selectedFicheIds, setSelectedFicheIds] = useState<number[]>([]);

  const handleSelectFiche = (ficheId: number) => {
    if (selectedFicheIds.includes(ficheId)) {
      setSelectedFicheIds(selectedFicheIds.filter((id) => id !== ficheId));
    } else {
      setSelectedFicheIds([...selectedFicheIds, ficheId]);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedFicheIds(
        ficheResumes.allIds || []
      );
    } else {
      setSelectedFicheIds([]);
    }
  };

  const resetSelection = () => {
    setSelectedFicheIds([]);
  };

  const selectAll = ficheResumes?.data?.every((fiche: any) =>
    selectedFicheIds.includes(fiche.id)
  );

  // Reset selection when page changes
  useEffect(() => {
    resetSelection();
  }, [currentPage]);

  return {
    selectedFicheIds,
    handleSelectFiche,
    handleSelectAll,
    resetSelection,
    selectAll,
  };
};
