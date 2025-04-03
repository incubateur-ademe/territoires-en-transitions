'use client';

import {
  CurrentCollectivite,
  useGetCurrentCollectivite,
} from '@/app/collectivites/use-get-current-collectivite';
import { createContext, ReactNode, useContext } from 'react';
import { z } from 'zod';

type ContextProps = {
  collectiviteId: number;
  collectivite: CurrentCollectivite;
};

const CollectiviteContext = createContext<ContextProps | null>(null);

export function CollectiviteProvider({
  collectiviteId: unsafeCollectiviteId,
  children,
}: {
  collectiviteId: number;
  children: ReactNode;
}) {
  const collectiviteId = z.coerce.number().parse(unsafeCollectiviteId);

  const { data: collectivite } = useGetCurrentCollectivite(collectiviteId);

  if (!collectivite) {
    return null;
  }

  return (
    <CollectiviteContext.Provider value={{ collectiviteId, collectivite }}>
      {children}
    </CollectiviteContext.Provider>
  );
}

function useCollectivite() {
  const context = useContext(CollectiviteContext);
  if (!context) {
    throw new Error(
      'useCollectivite must be used within a CollectiviteProvider'
    );
  }
  return context;
}

export function useCollectiviteId() {
  return useCollectivite().collectiviteId;
}

export function useCurrentCollectivite() {
  return useCollectivite().collectivite;
}
