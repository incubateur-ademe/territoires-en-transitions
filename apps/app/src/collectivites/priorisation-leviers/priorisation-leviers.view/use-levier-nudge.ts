'use client';

import useLocalStorage from 'react-use/lib/useLocalStorage';

const STORAGE_KEY = 'tet_priorisation_levier_nudge_dismissed';
const DISMISSED = 'true';

type LevierNudge = {
  isDismissed: boolean;
  dismiss: () => void;
  reset: () => void;
};

const useLevierNudge = (): LevierNudge => {
  const [storedDismissal, setStoredDismissal, remove] = useLocalStorage<string>(
    STORAGE_KEY,
    undefined,
    { raw: true }
  );

  return {
    isDismissed: storedDismissal === DISMISSED,
    dismiss: () => setStoredDismissal(DISMISSED),
    reset: remove,
  };
};

export { useLevierNudge };
export type { LevierNudge };
