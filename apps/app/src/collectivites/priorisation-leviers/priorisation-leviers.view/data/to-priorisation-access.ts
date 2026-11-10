type TrajectoireState =
  | 'loading'
  | 'failed'
  | 'computed'
  | 'notComputed'
  | 'notAvailable'
  | 'reservedToEpci';

type SettledTrajectoireState = Exclude<TrajectoireState, 'loading' | 'failed'>;

export type BlockedPriorisationAccess =
  | 'reservedToEpci'
  | 'missingTrajectoire'
  | 'trajectoireNotAvailable'
  | 'missingActions';

export type PriorisationAccess = BlockedPriorisationAccess | 'open';

export const toTrajectoireState = ({
  hasTrajectoire,
  isLoadingError,
  isTrajectoireNotComputed,
  isTrajectoireNotAvailable,
  isCollectiviteNotEpci,
}: {
  hasTrajectoire: boolean;
  isLoadingError: boolean;
  isTrajectoireNotComputed: boolean;
  /** SNBC 3 : EPCI absent du millésime importé, rien à calculer. */
  isTrajectoireNotAvailable: boolean;
  isCollectiviteNotEpci: boolean;
}): TrajectoireState => {
  if (hasTrajectoire) {
    return 'computed';
  }
  if (!isLoadingError) {
    return 'loading';
  }
  if (isTrajectoireNotComputed) {
    return 'notComputed';
  }
  if (isTrajectoireNotAvailable) {
    return 'notAvailable';
  }
  if (isCollectiviteNotEpci) {
    return 'reservedToEpci';
  }
  return 'failed';
};

export const toPriorisationAccess = ({
  hasMobilisation,
  trajectoireState,
}: {
  hasMobilisation: boolean;
  trajectoireState: SettledTrajectoireState;
}): PriorisationAccess => {
  if (trajectoireState === 'reservedToEpci') {
    return 'reservedToEpci';
  }
  if (trajectoireState === 'notComputed') {
    return 'missingTrajectoire';
  }
  if (trajectoireState === 'notAvailable') {
    return 'trajectoireNotAvailable';
  }
  if (!hasMobilisation) {
    return 'missingActions';
  }
  return 'open';
};
