'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

/**
 * Les lignes groupées d'un tableau — un dépôt de Supra et les EPCI qu'il
 * couvre. Chacune a son état par défaut : on retient celles qu'on a basculées.
 */
export type GroupesRepliables = {
  estDeplie: (cle: string) => boolean;
  basculer: (cle: string) => void;
};

const GroupesRepliablesContext = createContext<GroupesRepliables | null>(null);

export const GroupesRepliablesProvider = GroupesRepliablesContext.Provider;

export const useGroupesRepliables = (): GroupesRepliables => {
  const groupes = useContext(GroupesRepliablesContext);
  if (groupes === null) {
    throw new Error(
      'Les lignes groupées attendent un GroupesRepliablesProvider.'
    );
  }
  return groupes;
};

const TOUJOURS_DEPLIE = () => false;

/**
 * L'état des groupes d'un tableau, tous dépliés sauf ceux que
 * `estReplieParDefaut` désigne. Le prédicat doit être stable d'un rendu à
 * l'autre.
 */
export const useEtatGroupesRepliables = (
  estReplieParDefaut: (cle: string) => boolean = TOUJOURS_DEPLIE
): GroupesRepliables => {
  const [bascules, setBascules] = useState<ReadonlySet<string>>(new Set());
  const basculer = useCallback(
    (cle: string) =>
      setBascules((courants) => {
        const suivants = new Set(courants);
        if (!suivants.delete(cle)) {
          suivants.add(cle);
        }
        return suivants;
      }),
    []
  );
  return useMemo(
    () => ({
      estDeplie: (cle: string) => estReplieParDefaut(cle) === bascules.has(cle),
      basculer,
    }),
    [bascules, basculer, estReplieParDefaut]
  );
};
