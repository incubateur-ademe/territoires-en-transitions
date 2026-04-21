import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DBClient, useSupabase, useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { getReferentielIdFromActionId } from '@tet/domain/referentiels';

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
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useMutation(
    trpc.referentiels.actions.updateCommentaire.mutationOptions({
      // On rafraîchit l'historique dans `onSettled` plutôt que `onSuccess`
      // pour rester cohérent avec le pattern de
      // `useSetPersonnalisationJustification` : le cache historique doit
      // être invalidé même en cas d'échec (pour rebondir sur l'état serveur
      // après un rollback optimistique), et la promesse de mutation ne se
      // résout qu'une fois les invalidations propagées.
      onSettled: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.referentiels.historique.list.queryKey(),
        });
        await queryClient.invalidateQueries({
          queryKey: trpc.referentiels.historique.listUtilisateurs.queryKey(),
        });
      },
    })
  );
};
