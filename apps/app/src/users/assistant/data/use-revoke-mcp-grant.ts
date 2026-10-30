import { appLabels } from '@/app/labels/catalog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '@tet/api';
import { MCP_GRANTS_QUERY_KEY } from './use-list-mcp-grants';

export const useRevokeMcpGrant = () => {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (clientId: string) => {
      const { error } = await supabase.auth.oauth.revokeGrant({ clientId });
      if (error) {
        throw error;
      }
    },
    meta: {
      success: appLabels.assistantRevoquerSucces,
      error: appLabels.assistantRevoquerErreur,
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: MCP_GRANTS_QUERY_KEY }),
  });
};
