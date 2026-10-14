import { LevierId } from '@tet/domain/shared';
import { useMemo } from 'react';
import { LevierPriorisation } from './to-leviers-priorisation';
import {
  findLevierToPrioritizeId,
  LevierPlace,
  toLeviersPlaces,
} from './to-matrix-points';
import { LeviersPriorisationQuery } from './use-leviers-priorisation';

type LeviersPlaces = {
  leviers: LevierPriorisation[];
  places: LevierPlace[];
  levierToPrioritizeId?: LevierId;
};

const NO_LEVIERS: LevierPriorisation[] = [];

const useLeviersPlaces = (
  leviersQuery: LeviersPriorisationQuery
): LeviersPlaces => {
  const isReady = leviersQuery.status === 'ready';
  const leviers = isReady ? leviersQuery.leviers : NO_LEVIERS;
  const places = useMemo(() => toLeviersPlaces(leviers), [leviers]);
  const levierToPrioritizeId = useMemo(
    () => findLevierToPrioritizeId(places),
    [places]
  );

  return { leviers, places, levierToPrioritizeId };
};

export { useLeviersPlaces };
