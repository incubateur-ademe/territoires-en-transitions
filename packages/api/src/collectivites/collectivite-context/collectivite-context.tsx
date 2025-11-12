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
  setCollectivite: (collectivite: CollectiviteAccess) => void;
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
    useLocalStorage<StoredCollectivite>(getStorageKey(user.id));

  const [collectivite, setCollectivite] = useState<CollectiviteAccess | null>(
    null
  );

  if (
    collectivite &&
    collectivite.collectiviteId !== storedCollectivite?.collectiviteId &&
    user.collectivites.find(
      (c) => c.collectiviteId === collectivite.collectiviteId
    )
  ) {
    // Only store the newly selected collectiviteId in localStorage if it is one of the user's collectivites
    // Do not store the collectiviteId when visiting other collectivites.
    setStoredCollectivite({ collectiviteId: collectivite.collectiviteId });
  }

  if (!collectivite) {
    if (storedCollectivite?.collectiviteId) {
      const collectiviteBasedOnStorage = user.collectivites.find(
        (c) => c.collectiviteId === storedCollectivite.collectiviteId
      );
      if (collectiviteBasedOnStorage) {
        setCollectivite(collectiviteBasedOnStorage);
      } else if (defaultCollectivite) {
        // Related to historical reasons (stored collectiviteId before this fix), not supposed to happen
        setStoredCollectivite({
          collectiviteId: defaultCollectivite.collectiviteId,
        });
        setCollectivite(defaultCollectivite);
      }
    } else if (defaultCollectivite) {
      setCollectivite(defaultCollectivite);
    }
  }

  return (
    <CollectiviteContext.Provider
      value={{
        collectiviteId: collectivite?.collectiviteId,
        collectivite,
        setCollectivite,
      }}
    >
      {children}
    </CollectiviteContext.Provider>
  );
}

function getStorageKey(userId: string) {
  return `${STORAGE_KEY_PREFIX}_${userId}`;
}
