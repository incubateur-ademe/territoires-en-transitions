import { useQuery } from '@tanstack/react-query';
import { useSupabase } from '@tet/api';

export const MCP_GRANTS_QUERY_KEY = ['users', 'assistant', 'mcp-grants'];

/**
 * Autorisations OAuth données par l'utilisateur, tenues par Supabase Auth :
 * ses clients sont les connecteurs MCP (Claude.ai, Claude Desktop…).
 */
export const useListMcpGrants = () => {
  const supabase = useSupabase();
  return useQuery({
    queryKey: MCP_GRANTS_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase.auth.oauth.listGrants();
      if (error) {
        throw error;
      }
      return data;
    },
    // Serveur OAuth désactivé (en local notamment) : on n'insiste pas.
    retry: false,
  });
};
