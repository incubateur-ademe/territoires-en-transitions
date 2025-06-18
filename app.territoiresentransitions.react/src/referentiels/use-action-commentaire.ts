import { DBClient, TablesInsert } from '@/api';
import { useCollectiviteId } from '@/api/collectivites';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { getReferentielIdFromActionId } from '@/domain/referentiels';
import { useMutation, useQuery, useQueryClient } from 'react-query';

/**
 * Permet de charger un commentaire (précision) pour une action.
 *
 * Charge tous les commentaires en une seule requête.
 *
 * @param action_id
 * @return Un ActionCommentaireRead et un bool isLoading.
 */
export const useActionCommentaire = (action_id: string) => {
  const collectivite_id = useCollectiviteId();
  const referentiel = getReferentielIdFromActionId(action_id);
  const { data, isLoading } = useReferentielCommentaires(
    collectivite_id,
    referentiel
  );
  return {
    actionCommentaire:
      data?.find((action) => action.action_id === action_id) || null,
    isLoading,
  };
};

type CommentaireParams = {
  collectivite_id: number;
  action_id: string;
};

/**
 * Permet de charger les commentaires (précisions) d'une collectivité pour
 * toutes les actions d'un référentiel.
 *
 * @param action_id
 * @return Un ActionCommentaireRead et un bool isLoading.
 */
export const useReferentielCommentaires = (
  collectivite_id: number | null,
  referentiel: string | null
) => {
  const supabase = useSupabase();
  return useQuery(['action_commentaire', collectivite_id, referentiel], () =>
    collectivite_id && referentiel
      ? read(supabase, { collectivite_id, referentiel })
      : null
  );
};

const read = async (
  supabase: DBClient,
  {
    collectivite_id,
    referentiel,
  }: Pick<CommentaireParams, 'collectivite_id'> & { referentiel: string }
) => {
  const { data } = await supabase
    .from('action_commentaire')
    .select()
    .eq('collectivite_id', collectivite_id)
    .ilike('action_id', `${referentiel}%`);

  return data;
};

export const useSaveActionCommentaire = () => {
  const queryClient = useQueryClient();
  const supabase = useSupabase();

  const {
    isLoading,
    mutate: saveActionCommentaire,
    data: lastReply,
  } = useMutation(
    async (commentaire: ActionCommentaireWrite) =>
      supabase.from('action_commentaire').upsert([commentaire], {
        onConflict: 'collectivite_id,action_id',
      }),
    {
      mutationKey: 'action_commentaire',
      onSuccess: (data, variables) => {
        if (!data.error) {
          return queryClient.refetchQueries([
            'action_commentaire',
            variables.collectivite_id,
            getReferentielIdFromActionId(variables.action_id),
          ]);
        }
      },
    }
  );

  return {
    isLoading,
    saveActionCommentaire,
    lastReply,
  };
};

type ActionCommentaireWrite = TablesInsert<'action_commentaire'>;
