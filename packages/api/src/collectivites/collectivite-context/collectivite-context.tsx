'use client';

import {
  CollectiviteAccess,
  UserWithCollectiviteAccesses,
} from '@/domain/users';
import { createContext, ReactNode, useMemo, useState } from 'react';
import useLocalStorage from 'react-use/lib/useLocalStorage';

const STORAGE_KEY_PREFIX = 'tet_collectivite';

type StoredCollectivite = {
  collectiviteId: number;
};

type ContextProps = {
  collectiviteId: number | undefined;
  collectivite: CollectiviteAccess | null;
  storeCollectivite: (collectivite: CollectiviteAccess) => void;
};

export const CollectiviteContext = createContext<ContextProps | null>(null);

function useGetCurrentCollectivite(args: {
  availableCollectivites: CollectiviteAccess[];
  collectivite: CollectiviteAccess | null;
  storedCollectivite: StoredCollectivite | undefined;
  defaultCollectivite: CollectiviteAccess | null;
}): CollectiviteAccess | null {
  const collectiviteFromStorage = useMemo(
    () =>
      args.availableCollectivites.find(
        (c) => c.collectiviteId === args.storedCollectivite?.collectiviteId
      ) || null,
    [args.storedCollectivite?.collectiviteId, args.availableCollectivites]
  );

  const currentCollectivite =
    collectiviteFromStorage ?? args.collectivite ?? args.defaultCollectivite;

  return currentCollectivite;
}

export function CollectiviteProvider_OnlyImportWithoutSSR({
  user,
  children,
}: {
  user: Pick<UserWithCollectiviteAccesses, 'collectivites' | 'id'>;
  children: ReactNode;
}) {
  const defaultCollectivite =
    user.collectivites.length > 0 ? user.collectivites[0] : null;

  const [storedCollectivite, setStoredCollectivite] =
    useLocalStorage<StoredCollectivite>(
      getStorageKey(user.id),
      defaultCollectivite
        ? { collectiviteId: defaultCollectivite.collectiviteId }
        : undefined
    );

  const [collectivite, setCollectivite] = useState<CollectiviteAccess | null>(
    defaultCollectivite
  );

  const storeCollectivite = (collectivite: CollectiviteAccess) => {
    setCollectivite(collectivite);
    setStoredCollectivite({ collectiviteId: collectivite.collectiviteId });
  };

  const currentCollectivite = useGetCurrentCollectivite({
    availableCollectivites: user.collectivites,
    collectivite,
    storedCollectivite,
    defaultCollectivite,
  });

  if (currentCollectivite?.collectiviteId !== collectivite?.collectiviteId) {
    setCollectivite(currentCollectivite);
  }
  return (
    <CollectiviteContext.Provider
      value={{
        collectiviteId: currentCollectivite?.collectiviteId,
        collectivite: currentCollectivite ?? null,
        storeCollectivite,
      }}
    >
      {children}
    </CollectiviteContext.Provider>
  );
}

function getStorageKey(userId: string) {
  return `${STORAGE_KEY_PREFIX}_${userId}`;
}
