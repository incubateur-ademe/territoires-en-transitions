const getRange = (start: number, end: number) =>
  Array.from({ length: end - start + 1 }, (_, k) => start + k);

/** Calcule le tableau pagination en fonction de la page courante,
 * du nombre total de pages, et de la taille d'écran */
export const calculatePaginationArray = ({
  isMobile,
  nbOfPages,
  currentPage,
}: {
  isMobile: boolean;
  nbOfPages: number;
  currentPage: number;
}) => {
  // Nombre maximum de boutons visibles sur la pagination
  const maxPages = isMobile ? 5 : 7;

  // Affiche la totalité des boutons
  const displayAllPages = nbOfPages <= maxPages;

  // Nombre maximum de boutons visibles sur les extrémités
  const leftLimit = isMobile ? 2 : 3;
  const rightLimit = isMobile ? nbOfPages - 1 : nbOfPages - 2;

  // Adapte les limites gauche et droite en fonction de la page actuelle
  let leftMaxLimit = leftLimit;
  let rightMinLimit = rightLimit;
  if (currentPage === leftLimit) {
    leftMaxLimit++;
    rightMinLimit++;
  }
  if (currentPage === rightLimit) {
    leftMaxLimit--;
    rightMinLimit--;
  }

  // La page sélectionnée est une page centrale
  const isMiddlePage = currentPage > leftLimit && currentPage < rightLimit;

  // Nombre de boutons visibles autour d'une page centrale
  const middleRangeGap = isMobile ? 0 : 1;

  // Boutons au milieu de la pagination (ou totalité des boutons si nbOfPages <= maxPages)
  const middleRange =
    displayAllPages || isMiddlePage
      ? getRange(
          displayAllPages ? 1 : currentPage - middleRangeGap,
          displayAllPages ? nbOfPages : currentPage + middleRangeGap
        )
      : [];

  // Boutons à gauche et à droite de la pagination
  const leftRange = !displayAllPages
    ? getRange(1, isMiddlePage ? 1 : leftMaxLimit)
    : [];

  const rightRange = !displayAllPages
    ? getRange(isMiddlePage ? nbOfPages : rightMinLimit, nbOfPages)
    : [];

  // Remplace le bouton "..." s'il n'y a qu'une seule page masquée
  const leftIntersection =
    isMiddlePage && middleRange[0] - leftRange[leftRange.length - 1] === 2
      ? middleRange[0] - 1
      : undefined;

  const rightIntersection =
    isMiddlePage && rightRange[0] - middleRange[middleRange.length - 1] === 2
      ? rightRange[0] - 1
      : undefined;

  // Construction du tableau final
  const finalArray = [...leftRange];
  if (!displayAllPages && leftIntersection !== undefined) {
    finalArray.push(leftIntersection);
  }

  finalArray.push(...middleRange);

  if (isMiddlePage && !displayAllPages && rightIntersection !== undefined) {
    finalArray.push(rightIntersection);
  }

  finalArray.push(...rightRange);

  return finalArray;
};
