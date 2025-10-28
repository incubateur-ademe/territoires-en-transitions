'use client';

import { CurrentCollectivite } from '@/api/collectivites/fetch-current-collectivite';
import { UserDetails } from '@/api/users/user-details.fetch.server';
import { createContext, ReactNode, useState } from 'react';
import useLocalStorage from 'react-use/lib/useLocalStorage';

const STORAGE_KEY_PREFIX = 'tet_collectivite';

type StoredCollectivite = {
  collectiviteId: number;
};

type ContextProps = {
  collectiviteId: number | undefined;
  collectivite: CurrentCollectivite | null;
  storeCollectivite: (collectivite: CurrentCollectivite) => void;
};

export const CollectiviteContext = createContext<ContextProps | null>(null);

export function CollectiviteProvider_OnlyImportWithoutSSR({
  user,
  children,
}: {
  user: Pick<UserDetails, 'collectivites' | 'id'>;
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

  const [collectivite, setCollectivite] = useState<CurrentCollectivite | null>(
    defaultCollectivite
  );

  const storeCollectivite = (collectivite: CurrentCollectivite) => {
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
