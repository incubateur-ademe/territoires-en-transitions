'use client';
import { makeCollectiviteFicheNonClasseeUrl } from '@/app/app/paths';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DBClient, useSupabase } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { useRouter } from 'next/navigation';
import { objectToCamel } from 'ts-case-convert';

/** Upsert une fiche action pour une collectivité */
const upsertFicheAction = async (
  supabase: DBClient,
  collectiviteId: number
) => {
  const query = supabase
    .from('fiches_action')
    .insert({ collectivite_id: collectiviteId } as any)
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
  const router = useRouter();
  const supabase = useSupabase();

  return useMutation({
    mutationFn: () => upsertFicheAction(supabase, collectiviteId),
    meta: { disableToast: true },

    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['axe_fiches', null],
      });
      if (data.id) {
        const url = makeCollectiviteFicheNonClasseeUrl({
          collectiviteId,
          ficheUid: data.id.toString(),
        });
        router.push(url);
      }
    },
  });
};
