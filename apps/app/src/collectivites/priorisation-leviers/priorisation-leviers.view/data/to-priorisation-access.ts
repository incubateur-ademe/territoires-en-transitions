type TrajectoireState =
  | 'loading'
  | 'failed'
  | 'computed'
  | 'notComputed'
  | 'reservedToEpci';

type SettledTrajectoireState = Exclude<TrajectoireState, 'loading' | 'failed'>;

export type BlockedPriorisationAccess =
  | 'reservedToEpci'
  | 'missingTrajectoire'
  | 'missingActions';

export type PriorisationAccess = BlockedPriorisationAccess | 'open';

export const toTrajectoireState = ({
  hasTrajectoire,
  isLoadingError,
  isTrajectoireNotComputed,
  isCollectiviteNotEpci,
}: {
  hasTrajectoire: boolean;
  isLoadingError: boolean;
  isTrajectoireNotComputed: boolean;
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
  if (!hasMobilisation) {
    return 'missingActions';
  }
  return 'open';
};
