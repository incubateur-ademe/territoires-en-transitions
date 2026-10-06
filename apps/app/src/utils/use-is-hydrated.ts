import { useSyncExternalStore } from 'react';

const subscribeToNothing = (): (() => void) => () => undefined;

export const useIsHydrated = (): boolean =>
  useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false
  );
