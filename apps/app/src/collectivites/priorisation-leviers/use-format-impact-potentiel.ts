import { useCallback } from 'react';
import { toImpactPotentielLabel } from './to-impact-potentiel-label';

export const useFormatImpactPotentiel = (
  potentielTotal: number
): ((potentielReduction: number) => string) =>
  useCallback(
    (potentielReduction: number): string =>
      toImpactPotentielLabel({ potentielReduction, potentielTotal }),
    [potentielTotal]
  );
