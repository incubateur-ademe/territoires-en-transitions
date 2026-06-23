export const isActeEngagementVisible = ({
  isCOT,
  hasAtLeastOneStar,
}: {
  isCOT: boolean;
  hasAtLeastOneStar: boolean;
}): boolean => !isCOT && !hasAtLeastOneStar;
