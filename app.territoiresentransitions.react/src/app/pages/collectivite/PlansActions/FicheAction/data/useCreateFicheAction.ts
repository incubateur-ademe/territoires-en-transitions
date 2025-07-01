'use client';
import { DBClient } from '@/api';
import { useCollectiviteId } from '@/api/collectivites';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { makeCollectiviteFicheNonClasseeUrl } from '@/app/app/paths';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from 'react-query';
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

  return useMutation(() => upsertFicheAction(supabase, collectiviteId!), {
    meta: { disableToast: true },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['axe_fiches', null]);
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
