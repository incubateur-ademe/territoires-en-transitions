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
 * couvre — dépliées par défaut : on retient celles qu'on a repliées.
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

/** L'état des groupes d'un tableau, et la bascule de tous à la fois. */
export const useEtatGroupesRepliables = (clesDesGroupes: string[]) => {
  const [replies, setReplies] = useState<ReadonlySet<string>>(new Set());
  const basculer = useCallback(
    (cle: string) =>
      setReplies((courants) => {
        const suivants = new Set(courants);
        if (!suivants.delete(cle)) {
          suivants.add(cle);
        }
        return suivants;
      }),
    []
  );
  const groupes = useMemo(
    () => ({ estDeplie: (cle: string) => !replies.has(cle), basculer }),
    [replies, basculer]
  );
  const toutDeplie = replies.size === 0;

  return {
    groupes,
    toutDeplie,
    basculerTous: () =>
      setReplies(toutDeplie ? new Set(clesDesGroupes) : new Set()),
  };
};
