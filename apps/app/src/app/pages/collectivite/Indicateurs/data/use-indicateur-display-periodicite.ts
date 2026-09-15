import {
  type IndicateurPeriodicite,
  resolveIndicateurDisplayPeriodicite,
} from '@tet/domain/indicateurs';
import { useCallback, useState } from 'react';

type Input = {
  indicateurId?: number;
  collectiviteId: number;
  periodicite?: IndicateurPeriodicite;
};

/** Local chart preference; declaration cadence and stored values stay unchanged. */
export const useIndicateurDisplayPeriodicite = ({
  indicateurId,
  collectiviteId,
  periodicite,
}: Input) => {
  const scope = `${collectiviteId}/${indicateurId}/${periodicite}`;
  const [selection, setSelection] = useState<{
    scope: string;
    periodicite?: IndicateurPeriodicite;
  }>({ scope });

  // Reset the local choice when this chart displays another indicator or cadence.
  if (selection.scope !== scope) {
    setSelection({ scope });
  }

  const periodiciteAffichage = periodicite
    ? resolveIndicateurDisplayPeriodicite(
        periodicite,
        selection.scope === scope ? selection.periodicite : undefined
      )
    : undefined;
  const setPeriodiciteAffichage = useCallback(
    (display: IndicateurPeriodicite) => {
      if (!periodicite) return;
      setSelection({
        scope,
        periodicite: resolveIndicateurDisplayPeriodicite(periodicite, display),
      });
    },
    [periodicite, scope]
  );

  return { periodiciteAffichage, setPeriodiciteAffichage };
};
