import { supabaseClient } from 'core-logic/api/supabase';
import { QueryKey, useMutation, useQueryClient } from 'react-query';
import { objectToSnake } from 'ts-case-convert';

type Pilote = {
  ficheId: number;
  userId?: string | null;
  tagId?: number | null;
};

export const useFicheActionAddPilote = (keysToInvalidate?: QueryKey[]) => {
  const queryClient = useQueryClient();

  return useMutation(
    async (pilotes: Pilote[]) => {
      await supabaseClient
        .from('fiche_action_pilote')
        .upsert(objectToSnake(pilotes), { onConflict: 'fiche_id,user_id' });
    },
    {
      onSuccess: () => {
        keysToInvalidate?.forEach((key) => queryClient.invalidateQueries(key));
      },
    }
  );
};

export const useFicheActionRemoveUserPilote = (
  keysToInvalidate?: QueryKey[]
) => {
  const queryClient = useQueryClient();

  return useMutation(
    async (pilotes: Pilote[]) => {
      await supabaseClient
        .from('fiche_action_pilote')
        .delete()
        .in(
          'fiche_id',
          pilotes.map((pilote) => pilote.ficheId)
        )
        .in(
          'user_id',
          pilotes.map((pilote) => pilote.userId)
        );
    },
    {
      onSuccess: () => {
        keysToInvalidate?.forEach((key) => queryClient.invalidateQueries(key));
      },
    }
  );
};

export const useFicheActionRemoveTagPilote = (
  keysToInvalidate?: QueryKey[]
) => {
  const queryClient = useQueryClient();

  return useMutation(
    async (pilotes: Pilote[]) => {
      await supabaseClient
        .from('fiche_action_pilote')
        .delete()
        .in(
          'fiche_id',
          pilotes.map((pilote) => pilote.ficheId)
        )
        .in(
          'tag_id',
          pilotes.map((pilote) => pilote.tagId)
        );
    },
    {
      onSuccess: () => {
        keysToInvalidate?.forEach((key) => queryClient.invalidateQueries(key));
      },
    }
  );
};
