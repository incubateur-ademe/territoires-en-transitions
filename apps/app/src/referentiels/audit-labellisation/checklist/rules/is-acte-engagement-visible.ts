export const isActeEngagementVisible = ({
  isCOT,
  hasAtLeastOneStar,
}: {
  isCOT: boolean;
  hasAtLeastOneStar: boolean;
}): boolean => {
  const isCotOrHasAtLeastOneStar = isCOT || hasAtLeastOneStar;
  return isCotOrHasAtLeastOneStar === false;
};
