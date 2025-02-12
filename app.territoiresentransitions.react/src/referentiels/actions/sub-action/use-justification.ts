import { DBClient, TablesInsert } from '@/api';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useCollectiviteId } from '@/app/core-logic/hooks/params';
import { useMutation, useQuery, useQueryClient } from 'react-query';

const fetchJustification = async (
  supabase: DBClient,
  collectivite_id: number | null,
  action_id: string | null
) => {
  const { error, data } = await supabase
    .from('justification_ajustement')
    .select()
    .match({ collectivite_id, action_id });

  if (error) throw new Error(error.message);

  return data;
};

export const useActionJustification = (action_id: string) => {
  const collectivite_id = useCollectiviteId();
  const supabase = useSupabase();

  const { data, isLoading } = useQuery(
    ['action_justification', collectivite_id, action_id],
    () => fetchJustification(supabase, collectivite_id, action_id)
  );

  return {
    actionJustification: data ? data[0] : null,
    isLoading,
  };
};

export const useSaveActionJustification = () => {
  const queryClient = useQueryClient();
  const supabase = useSupabase();

  const {
    isLoading,
    mutate: saveActionJustification,
    data: lastReply,
  } = useMutation(
    async (justification: ActionJustificationWrite) =>
      supabase.from('justification_ajustement').upsert([justification], {
        onConflict: 'collectivite_id,action_id',
      }),
    {
      mutationKey: 'action_justification',
      onSuccess: (data, variables) => {
        queryClient.refetchQueries([
          'action_justification',
          variables.collectivite_id,
          variables.action_id,
        ]);
      },
    }
  );

  return {
    isLoading,
    saveActionJustification,
    lastReply,
  };
};

type ActionJustificationWrite = TablesInsert<'justification_ajustement'>;
