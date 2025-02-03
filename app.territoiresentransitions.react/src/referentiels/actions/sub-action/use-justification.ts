import { TablesInsert } from '@/api';
import { supabaseClient } from '@/api/utils/supabase/browser-client';
import { useCollectiviteId } from '@/app/core-logic/hooks/params';
import { useMutation, useQuery, useQueryClient } from 'react-query';

const fetchJustification = async (
  collectivite_id: number | null,
  action_id: string | null
) => {
  const { error, data } = await supabaseClient
    .from('justification_ajustement')
    .select()
    .match({ collectivite_id, action_id });

  if (error) throw new Error(error.message);

  return data;
};

export const useActionJustification = (action_id: string) => {
  const collectivite_id = useCollectiviteId();

  const { data, isLoading } = useQuery(
    ['action_justification', collectivite_id, action_id],
    () => fetchJustification(collectivite_id, action_id)
  );

  return {
    actionJustification: data ? data[0] : null,
    isLoading,
  };
};

export const useSaveActionJustification = () => {
  const queryClient = useQueryClient();
  const {
    isLoading,
    mutate: saveActionJustification,
    data: lastReply,
  } = useMutation(write, {
    mutationKey: 'action_justification',
    onSuccess: (data, variables) => {
      queryClient.refetchQueries([
        'action_justification',
        variables.collectivite_id,
        variables.action_id,
      ]);
    },
  });

  return {
    isLoading,
    saveActionJustification,
    lastReply,
  };
};

type ActionJustificationWrite = TablesInsert<'justification_ajustement'>;
const write = async (justification: ActionJustificationWrite) =>
  supabaseClient.from('justification_ajustement').upsert([justification], {
    onConflict: 'collectivite_id,action_id',
  });
