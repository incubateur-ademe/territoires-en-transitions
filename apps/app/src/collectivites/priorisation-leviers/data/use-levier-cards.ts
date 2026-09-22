'use client';

import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { LevierCard, toLevierCards } from '../to-levier-cards';

export type LevierCardsQuery =
  | { status: 'loading' }
  | { status: 'error'; retry: () => void }
  | { status: 'ready'; cards: LevierCard[] };

export const useLevierCards = (collectiviteId: number): LevierCardsQuery => {
  const trpc = useTRPC();

  const {
    data: cards,
    isError,
    refetch,
  } = useQuery(
    trpc.collectivites.pertinenceLeviers.list.queryOptions(
      { collectiviteId, enjeu: 'ges' },
      { select: toLevierCards }
    )
  );

  if (cards) {
    return { status: 'ready', cards };
  }
  if (isError) {
    return { status: 'error', retry: () => void refetch() };
  }
  return { status: 'loading' };
};
