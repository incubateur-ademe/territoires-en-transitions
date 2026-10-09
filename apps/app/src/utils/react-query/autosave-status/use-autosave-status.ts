'use client';

import { useQueryClient } from '@tanstack/react-query';
import type { AutosaveStatus } from '@tet/ui';
import { useEffect, useReducer } from 'react';
import {
  hasAutosaveKey,
  initialAutosaveState,
  reduceAutosaveState,
  toAutosaveStatus,
} from './autosave-status';

/**
 * Écoute les événements du cache des mutations à partir du montage, plutôt
 * que d'en relire le contenu :
 * - l'observateur `useMutation` ne suit que le dernier `mutate`, et deux
 *   cellules en vol y laissaient la plus rapide afficher « Enregistré » ;
 * - le cache garde les mutations finies jusqu'à leur `gcTime` : un tableau
 *   rouvert y aurait retrouvé l'état de la visite précédente.
 */
export const useAutosaveStatus = (autosaveKey: string): AutosaveStatus => {
  const queryClient = useQueryClient();
  const [state, dispatch] = useReducer(
    reduceAutosaveState,
    initialAutosaveState
  );

  useEffect(
    () =>
      queryClient.getMutationCache().subscribe((event) => {
        if (
          event.type !== 'updated' ||
          !hasAutosaveKey(event.mutation.options.meta, autosaveKey)
        ) {
          return;
        }
        dispatch({
          mutationId: event.mutation.mutationId,
          status: event.mutation.state.status,
        });
      }),
    [queryClient, autosaveKey]
  );

  return toAutosaveStatus(state);
};
