'use client';

import { CurrentCollectivite } from '@/api/collectivites/fetch-current-collectivite';
import { UserDetails } from '@/api/users/user-details.fetch.server';
import { createContext, ReactNode, useContext } from 'react';
import useLocalStorage from 'react-use/lib/useLocalStorage';

const STORAGE_KEY_PREFIX = 'tet_collectivite';

type ContextProps = {
  collectiviteId: number | undefined;
  collectivite: CurrentCollectivite | null;
  storeCollectivite: (collectivite: CurrentCollectivite) => void;
};

const CollectiviteContext = createContext<ContextProps | null>(null);

export function CollectiviteProvider({
  user,
  children,
}: {
  user: Pick<UserDetails, 'collectivites' | 'id'>;
  children: ReactNode;
}) {
  const defaultCollectivite =
    user.collectivites.length > 0 ? user.collectivites[0] : null;

  const [storedCollectivite, setStoredCollectivite] = useLocalStorage(
    getStorageKey(user.id),
    defaultCollectivite
  );

  const storeCollectivite = (collectivite: CurrentCollectivite) => {
    setStoredCollectivite(collectivite);
  };

  return (
    <CollectiviteContext.Provider
      value={{
        collectiviteId: storedCollectivite?.collectiviteId,
        collectivite: storedCollectivite ?? null,
        storeCollectivite,
      }}
    >
      {children}
    </CollectiviteContext.Provider>
  );
}

export function useCollectiviteContext() {
  const context = useContext(CollectiviteContext);
  if (!context) {
    throw new Error(
      'useCollectivite must be used within a CollectiviteProvider'
    );
  }
  return context;
}

export function useCollectiviteId(): number {
  const context = useCollectiviteContext();
  if (!context.collectiviteId) {
    throw new Error(
      'useCollectiviteId must be used within a CollectiviteProvider'
    );
  }
  return context.collectiviteId;
}

export function useCurrentCollectivite(): CurrentCollectivite {
  const context = useCollectiviteContext();
  if (!context.collectivite) {
    throw new Error(
      'useCurrentCollectivite must be used within a CollectiviteProvider'
    );
  }
  return context.collectivite;
}

function getStorageKey(userId: string) {
  return `${STORAGE_KEY_PREFIX}_${userId}`;
}
