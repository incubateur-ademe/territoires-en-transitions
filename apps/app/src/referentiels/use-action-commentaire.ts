import { DBClient, TablesInsert } from '@/api';
import { useCollectiviteId } from '@/api/collectivites';
import { useUser } from '@/api/users/user-context/user-provider';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { getReferentielIdFromActionId } from '@/domain/referentiels';
import { useMutation, useQuery } from '@tanstack/react-query';

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
  return useQuery({
    queryKey: ['action_commentaire', collectivite_id, referentiel],

    queryFn: () =>
      collectivite_id && referentiel
        ? read(supabase, { collectivite_id, referentiel })
        : null,
  });
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
  const supabase = useSupabase();
  const user = useUser();

  const {
    isPending,
    mutate: saveActionCommentaire,
    data: lastReply,
  } = useMutation({
    mutationKey: ['upsert_referentiel_action_commentaire'],
    mutationFn: async (commentaire: ActionCommentaireWrite) =>
      supabase
        .from('action_commentaire')
        .upsert([{ ...commentaire, modified_by: user.id }], {
          onConflict: 'collectivite_id,action_id',
        }),
  });

  return {
    isPending,
    saveActionCommentaire,
    lastReply,
  };
};

type ActionCommentaireWrite = TablesInsert<'action_commentaire'>;
