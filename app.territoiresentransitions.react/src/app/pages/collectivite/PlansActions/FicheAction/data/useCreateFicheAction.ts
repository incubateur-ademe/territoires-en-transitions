import { useMutation, useQueryClient } from 'react-query';

import { supabaseClient } from '@/api/utils/supabase/browser-client';
import { makeCollectiviteFicheNonClasseeUrl } from '@/app/app/paths';
import { useCollectiviteId } from '@/app/core-logic/hooks/params';
import { useRouter } from 'next/navigation';
import { objectToCamel } from 'ts-case-convert';

/** Upsert une fiche action pour une collectivité */
const upsertFicheAction = async (collectiviteId: number) => {
  const query = supabaseClient
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

  return useMutation(() => upsertFicheAction(collectiviteId!), {
    meta: { disableToast: true },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['axe_fiches', null]);
      if (data.id) {
        const url = makeCollectiviteFicheNonClasseeUrl({
          collectiviteId: collectiviteId!,
          ficheUid: data.id.toString(),
        });
        router.push(url);
      }
    },
  });
};
