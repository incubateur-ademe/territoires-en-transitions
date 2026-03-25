const getRange = (start: number, end: number) =>
  Array.from({ length: end - start + 1 }, (_, k) => start + k);

const compactPaginationProperties = {
  maxPages: 5,
  leftLimit: 2,
  middleRangeGap: 0,
  getRightLimit: (nbOfPages: number): number => nbOfPages - 1,
};

const regularPaginationProperties = {
  maxPages: 7,
  leftLimit: 3,
  middleRangeGap: 1,
  getRightLimit: (nbOfPages: number): number => nbOfPages - 2,
};

/** Calcule le tableau pagination en fonction de la page courante,
 * du nombre total de pages, et de la taille d'écran */
export const calculatePaginationArray = ({
  isCompact,
  nbOfPages,
  currentPage,
}: {
  isCompact: boolean;
  nbOfPages: number;
  currentPage: number;
}): (number | undefined)[] => {
  const { maxPages, leftLimit, middleRangeGap, getRightLimit } = isCompact
    ? compactPaginationProperties
    : regularPaginationProperties;

  const rightLimit = getRightLimit(nbOfPages);
  const displayAllPages = nbOfPages <= maxPages;

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

  const isMiddlePage = currentPage > leftLimit && currentPage < rightLimit;

  const middleRange =
    displayAllPages || isMiddlePage
      ? getRange(
          displayAllPages ? 1 : currentPage - middleRangeGap,
          displayAllPages ? nbOfPages : currentPage + middleRangeGap
        )
      : [];

  const leftRange = !displayAllPages
    ? getRange(1, isMiddlePage ? 1 : leftMaxLimit)
    : [];

  const rightRange = !displayAllPages
    ? getRange(isMiddlePage ? nbOfPages : rightMinLimit, nbOfPages)
    : [];

  const leftIntersection =
    isMiddlePage && middleRange[0] - leftRange[leftRange.length - 1] === 2
      ? middleRange[0] - 1
      : undefined;

  const rightIntersection =
    isMiddlePage && rightRange[0] - middleRange[middleRange.length - 1] === 2
      ? rightRange[0] - 1
      : undefined;

  const finalArray: (number | undefined)[] = [...leftRange];

  if (!displayAllPages) {
    finalArray.push(leftIntersection);
  }

  finalArray.push(...middleRange);

  if (isMiddlePage && !displayAllPages) {
    finalArray.push(rightIntersection);
  }

  finalArray.push(...rightRange);

  return finalArray;
};
