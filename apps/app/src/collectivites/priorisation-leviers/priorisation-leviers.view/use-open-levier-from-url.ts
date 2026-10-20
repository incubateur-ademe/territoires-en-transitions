import { priorisationLevierQueryParam } from '@/app/app/paths';
import { type LevierId, levierIdEnumValues } from '@tet/domain/shared';
import { parseAsStringLiteral, useQueryState } from 'nuqs';
import { useEffect, useEffectEvent, useState } from 'react';

export const useOpenLevierFromUrl = ({
  isReady,
  onLevierRequested,
}: {
  isReady: boolean;
  onLevierRequested: (levierId: LevierId) => void;
}): { isLevierRequestedByUrl: boolean } => {
  const [requestedLevierId, setRequestedLevierId] = useQueryState(
    priorisationLevierQueryParam,
    parseAsStringLiteral(levierIdEnumValues)
  );
  const [isLevierRequestedByUrl] = useState(requestedLevierId !== null);
  const openRequestedLevier = useEffectEvent((levierId: LevierId) => {
    onLevierRequested(levierId);
    void setRequestedLevierId(null);
  });

  const hasNoLevierToOpen = !isReady || requestedLevierId === null;

  useEffect(() => {
    if (hasNoLevierToOpen) {
      return;
    }
    openRequestedLevier(requestedLevierId);
  }, [hasNoLevierToOpen, requestedLevierId]);

  return { isLevierRequestedByUrl };
};
