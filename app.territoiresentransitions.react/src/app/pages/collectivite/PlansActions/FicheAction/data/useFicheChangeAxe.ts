import { useMutation, useQueryClient } from 'react-query';
import { supabaseClient } from 'core-logic/api/supabase';
import { dropAnimation } from '../../PlanAction/DragAndDropNestedContainers/Arborescence';
import { PlanNode } from '../../PlanAction/data/types';
import { sortFichesResume } from './utils';
import { FicheResume } from '@tet/api/plan-actions';

type Args = {
  fiche: FicheResume;
  old_axe_id: number;
  new_axe_id: number;
};

export const useFicheChangeAxe = ({ planId }: { planId: number }) => {
  const queryClient = useQueryClient();

  const flat_axes_Key = ['flat_axes', planId];

  return useMutation(
    async ({ fiche, new_axe_id, old_axe_id }: Args) => {
      await supabaseClient.rpc('deplacer_fiche_action_dans_un_axe', {
        fiche_id: fiche.id!,
        new_axe_id,
        old_axe_id,
      });
    },
    {
      mutationKey: 'fiche_change_axe',
      onMutate: async (args) => {
        const { fiche, new_axe_id, old_axe_id } = args;
        const fiche_id = fiche.id!;

        const old_axe_fiches_Key = ['axe_fiches', old_axe_id];
        const new_axe_fiches_Key = ['axe_fiches', new_axe_id];

        const previousData = [
          [flat_axes_Key, queryClient.getQueryData(flat_axes_Key)],
          [old_axe_fiches_Key, queryClient.getQueryData(old_axe_fiches_Key)],
          [new_axe_fiches_Key, queryClient.getQueryData(new_axe_fiches_Key)],
        ];

        queryClient.setQueryData(
          flat_axes_Key,
          (old: PlanNode[] | undefined): PlanNode[] => {
            if (old) {
              return old.map((axe) => {
                if (axe.id === old_axe_id) {
                  return {
                    ...axe,
                    fiches: axe.fiches?.filter((id) => id !== fiche_id) || [],
                  };
                } else if (axe.id === new_axe_id) {
                  return {
                    ...axe,
                    fiches: axe.fiches ? [...axe.fiches, fiche_id] : [fiche_id],
                  };
                } else {
                  return axe;
                }
              });
            } else {
              return [];
            }
          }
        );

        queryClient.setQueryData(
          old_axe_fiches_Key,
          (old: FicheResume[] | undefined): FicheResume[] => {
            return old?.filter((f) => f.id !== fiche_id) || [];
          }
        );

        queryClient.setQueryData(
          new_axe_fiches_Key,
          (old: FicheResume[] | undefined): FicheResume[] => {
            return sortFichesResume([...(old || []), fiche]);
          }
        );

        return previousData;
      },
      onError: (err, args, previousData) => {
        previousData?.forEach(([key, data]) =>
          queryClient.setQueryData(key as string[], data)
        );
      },
      onSuccess: (data, args) => {
        queryClient.invalidateQueries(flat_axes_Key).then(() => {
          args.fiche.id && dropAnimation(`fiche-${args.fiche.id.toString()}`);
        });
      },
    }
  );
};
