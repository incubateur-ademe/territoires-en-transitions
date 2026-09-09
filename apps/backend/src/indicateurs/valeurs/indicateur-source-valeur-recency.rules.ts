type IndicateurSourceValeurRecency = Readonly<{
  dateVersion: string | null | undefined;
  metadonneeId: number | null | undefined;
}>;

/**
 * Total ordering shared by reads and calculations for two values published by
 * the same source: latest dataset version first, then greatest metadata id.
 */
export const isMoreRecentIndicateurSourceValeur = (
  candidate: IndicateurSourceValeurRecency,
  current: IndicateurSourceValeurRecency
): boolean => {
  const versionComparison = (candidate.dateVersion ?? '').localeCompare(
    current.dateVersion ?? ''
  );
  if (versionComparison !== 0) {
    return versionComparison > 0;
  }

  return (candidate.metadonneeId ?? 0) > (current.metadonneeId ?? 0);
};
