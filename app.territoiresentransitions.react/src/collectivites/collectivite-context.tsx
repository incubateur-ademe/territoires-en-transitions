'use client';

import { createContext, ReactNode, useContext } from 'react';
import { z } from 'zod';

type ContextProps = {
  collectiviteId: number;
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

  return (
    <CollectiviteContext.Provider value={{ collectiviteId }}>
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
