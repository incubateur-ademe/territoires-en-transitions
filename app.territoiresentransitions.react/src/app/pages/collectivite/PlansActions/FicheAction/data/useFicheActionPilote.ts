import {supabaseClient} from 'core-logic/api/supabase';
import {QueryKey, useMutation, useQueryClient} from 'react-query';

type Pilote = {
  fiche_id: number;
  user_id?: string | null;
  tag_id?: number | null;
};

export const useFicheActionAddPilote = (keysToInvalidate?: QueryKey[]) => {
  const queryClient = useQueryClient();

  return useMutation(
    async (pilotes: Pilote[]) => {
      await supabaseClient
        .from('fiche_action_pilote')
        .upsert(pilotes, {onConflict: 'fiche_id,user_id'});
    },
    {
      onSuccess: () => {
        keysToInvalidate?.forEach(key => queryClient.invalidateQueries(key));
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
          pilotes.map(pilote => pilote.fiche_id)
        )
        .in(
          'user_id',
          pilotes.map(pilote => pilote.user_id)
        );
    },
    {
      onSuccess: () => {
        keysToInvalidate?.forEach(key => queryClient.invalidateQueries(key));
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
          pilotes.map(pilote => pilote.fiche_id)
        )
        .in(
          'tag_id',
          pilotes.map(pilote => pilote.tag_id)
        );
    },
    {
      onSuccess: () => {
        keysToInvalidate?.forEach(key => queryClient.invalidateQueries(key));
      },
    }
  );
};
