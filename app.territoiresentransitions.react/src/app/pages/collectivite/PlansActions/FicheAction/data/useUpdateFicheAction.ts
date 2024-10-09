import { FicheAction, ficheActionSchema } from '@tet/api/plan-actions';
import { supabaseClient } from 'core-logic/api/supabase';
import { useCollectiviteId } from 'core-logic/hooks/params';
import { useMutation, useQueryClient } from 'react-query';
import { objectToCamel, objectToSnake } from 'ts-case-convert';

/** Upsert une fiche action pour une collectivité */
const upsertFicheAction = async (fiche: FicheAction) => {
  const ficheToUpdateThroughPGView = ficheActionSchema
    .omit({
      planId: true,
      plans: true,
      modifiedAt: true,
      createdAt: true,
    })
    .parse(fiche);

  let query = supabaseClient
    .from('fiches_action')
    .insert(objectToSnake(ficheToUpdateThroughPGView) as any)
    .select()
    .single();

  const { error, data } = await query;

  if (error) {
    throw error;
  }

  return objectToCamel(data);
};

/**
 * Édite une fiche action
 */
export const useUpdateFicheAction = () => {
  const queryClient = useQueryClient();
  const collectiviteId = useCollectiviteId();

  return useMutation(upsertFicheAction, {
    mutationKey: 'edit_fiche',
    onSuccess: ({ id, axes }) => {
      queryClient.invalidateQueries(['fiche_action', id?.toString()]);
      axes?.forEach((axe) =>
        queryClient.invalidateQueries(['axe_fiches', axe.id])
      );
      // fiches non classées
      queryClient.invalidateQueries(['axe_fiches', null]);
      queryClient.invalidateQueries(['structures', collectiviteId]);
      queryClient.invalidateQueries(['partenaires', collectiviteId]);
      queryClient.invalidateQueries(['personnes_pilotes', collectiviteId]);
      queryClient.invalidateQueries(['personnes', collectiviteId]);
      queryClient.invalidateQueries(['services_pilotes', collectiviteId]);
      queryClient.invalidateQueries(['personnes_referentes', collectiviteId]);
      queryClient.invalidateQueries(['financeurs', collectiviteId]);
    },
  });
};
