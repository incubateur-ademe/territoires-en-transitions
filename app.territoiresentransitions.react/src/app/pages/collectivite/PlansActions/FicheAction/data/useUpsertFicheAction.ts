import {
  FicheAction,
  FicheActionInsert,
  ficheActionSchema,
  FicheResume,
} from '@tet/api/plan-actions';
import { ficheActionToResume } from 'app/pages/collectivite/PlansActions/FicheAction/data/utils';
import { makeCollectiviteFicheNonClasseeUrl } from 'app/paths';
import { supabaseClient } from 'core-logic/api/supabase';
import { useCollectiviteId } from 'core-logic/hooks/params';
import { useMutation, useQueryClient } from 'react-query';
import { useHistory } from 'react-router-dom';
import { objectToCamel, objectToSnake } from 'ts-case-convert';

/** Upsert une fiche action pour une collectivité */
const upsertFicheAction = async (fiche: FicheAction) => {
  const ficheToUpdateThroughPGView = ficheActionSchema
    .omit({
      planId: true,
      plans: true,
      modifiedAt: true,
      createdAt: true,
      axes: true,
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

export const useCreateFicheAction = () => {
  const queryClient = useQueryClient();
  const collectiviteId = useCollectiviteId();
  const history = useHistory();

  return useMutation(
    () =>
      upsertFicheAction({
        collectiviteId: collectiviteId!,
      } as never),
    {
      meta: { disableToast: true },
      onSuccess: (data) => {
        queryClient.invalidateQueries(['axe_fiches', null]);
        const url = makeCollectiviteFicheNonClasseeUrl({
          collectiviteId: collectiviteId!,
          ficheUid: data.id!.toString(),
        });
        history.push(url);
      },
    }
  );
};

/**
 * Édite une fiche action
 */
export const useEditFicheAction = () => {
  const queryClient = useQueryClient();
  const collectiviteId = useCollectiviteId();

  return useMutation(upsertFicheAction, {
    mutationKey: 'edit_fiche',
    onMutate: async (fiche) => {
      const ficheActionKey = ['fiche_action', fiche.id?.toString()];

      await queryClient.cancelQueries({ queryKey: ficheActionKey });

      // const previousData = [
      //   [axe_fiches_key, queryClient.getQueryData(axe_fiches_key)],
      //   [ficheActionKey, queryClient.getQueryData(ficheActionKey)],
      // ];

      const previousData =
        fiche.axes?.map((axeId) => {
          const key = ['axe_fiches', axeId || null];
          return [key, queryClient.getQueryData(key)];
        }) || [];

      previousData.push([
        ficheActionKey,
        queryClient.getQueryData(ficheActionKey),
      ]);

      queryClient.setQueryData(
        ficheActionKey,
        (old?: { fiche: FicheAction }) => ({
          fiche: {
            ...old?.fiche,
            ...fiche,
          },
        })
      );

      fiche.axes?.forEach((axeId) => {
        queryClient.setQueryData(
          ['axe_fiches', axeId || null],
          (old: FicheResume[] | undefined): FicheResume[] => {
            return (
              old?.map((f) =>
                f.id !== fiche.id ? f : ficheActionToResume(fiche)
              ) || []
            );
          }
        );
      });

      return previousData;
    },
    onSettled: (data, err, fiche, previousData) => {
      if (err) {
        previousData?.forEach(([key, data]) =>
          queryClient.setQueryData(key as string[], data)
        );
      }
      queryClient.invalidateQueries(['fiche_action', fiche.id?.toString()]);
      fiche.axes?.forEach((axe) =>
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
