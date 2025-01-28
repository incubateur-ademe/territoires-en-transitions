'use client';

import { createContext, ReactNode, useContext } from 'react';

type ContextProps = {
  collectiviteId: number;
};

const CollectiviteContext = createContext<ContextProps | null>(null);

export function CollectiviteProvider({
  collectiviteId,
  children,
}: {
  collectiviteId: number;
  children: ReactNode;
}) {
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
