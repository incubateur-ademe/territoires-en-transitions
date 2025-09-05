'use client';

import { CurrentCollectivite } from '@/api/collectivites/fetch-current-collectivite';
import { useGetCurrentCollectivite } from '@/api/collectivites/use-get-current-collectivite';
import { PermissionLevelEnum } from '@/backend/users/index-domain';
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

  const collectivite = useGetCurrentCollectivite(collectiviteId);

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

// TODO : may be move to an other file
export function useIsAdmin(): boolean {
  return (
    useCollectivite().collectivite.niveauAcces === PermissionLevelEnum.ADMIN
  );
}

export function useIsEditeur(): boolean {
  return (
    useCollectivite().collectivite.niveauAcces === PermissionLevelEnum.EDITION
  );
}
export function useIsLecteur(): boolean {
  return (
    useCollectivite().collectivite.niveauAcces === PermissionLevelEnum.LECTURE
  );
}

export function useCollectiviteId(): number {
  return useCollectivite().collectiviteId;
}

export function useCurrentCollectivite(): CurrentCollectivite {
  return useCollectivite().collectivite;
}
