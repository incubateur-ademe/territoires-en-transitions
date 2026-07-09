'use client';

import {
  CollectiviteRolesAndPermissions,
  UserWithRolesAndPermissions,
} from '@tet/domain/users';
import { createContext, ReactNode, useState } from 'react';
import useLocalStorage from 'react-use/lib/useLocalStorage';
import { CollectiviteCurrent } from './type';
import { toCollectiviteCurrent } from './utils';

const STORAGE_KEY_PREFIX = 'tet_collectivite';

type StoredCollectivite = {
  collectiviteId: number;
};

type ContextProps = {
  collectiviteId: number | undefined;
  collectivite: CollectiviteCurrent | null;
  setCollectivite: (collectivite: CollectiviteRolesAndPermissions) => void;
};

export const CollectiviteContext = createContext<ContextProps | null>(null);

export function CollectiviteProvider_OnlyImportWithoutSSR({
  user,
  children,
}: {
  user: UserWithRolesAndPermissions;
  children: ReactNode;
}) {
  const defaultCollectivite =
    user.collectivites.length > 0 ? user.collectivites[0] : null;

  const [storedCollectivite, setStoredCollectivite] =
    useLocalStorage<StoredCollectivite>(getStorageKey(user.id));

  const [collectivite, setCollectivite] =
    useState<CollectiviteRolesAndPermissions | null>(null);

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
    <CollectiviteContext
      value={{
        collectiviteId: collectivite?.collectiviteId,
        collectivite: collectivite
          ? toCollectiviteCurrent(collectivite, user)
          : null,
        setCollectivite,
      }}
    >
      {children}
    </CollectiviteContext>
  );
}

function getStorageKey(userId: string) {
  return `${STORAGE_KEY_PREFIX}_${userId}`;
}
