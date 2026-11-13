export const COLLECTIVITE_SOURCE_ID = 'collectivite';
export const PCAET_COLLECTIVITE_SOURCE_ID = 'pcaet-collectivite';
/** Indicator-value provenance, independent of the AI import profile. */
export const ELECTRIFICATION_SOURCE_ID = 'electrification';

/** These metadata identify a démarche or plan, rather than a source version. */
export const INDICATEUR_SOURCES_WITH_DEDICATED_METADATA: readonly string[] = [
  PCAET_COLLECTIVITE_SOURCE_ID,
  ELECTRIFICATION_SOURCE_ID,
];

/** External observations may only complete a field present in the direct source. */
export const INDICATEUR_SOURCES_REQUIRING_DIRECT_VALUE_PER_FIELD: readonly string[] =
  [ELECTRIFICATION_SOURCE_ID];

/** Maximum number of distinct indicator periods written atomically by a grid. */
export const MAX_GRID_VALEURS_BATCH_SIZE = 1000;
