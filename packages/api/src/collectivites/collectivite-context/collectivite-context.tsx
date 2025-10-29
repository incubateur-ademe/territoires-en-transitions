'use client';

import {
  CollectiviteAccess,
  UserWithCollectiviteAccesses,
} from '@/domain/users';
import { createContext, ReactNode, useState } from 'react';
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

  return (
    <CollectiviteContext.Provider
      value={{
        collectiviteId: storedCollectivite?.collectiviteId,
        collectivite: collectivite ?? null,
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
