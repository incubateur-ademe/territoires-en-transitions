import { useTRPC } from '@tet/api';
import { useQueryClient } from '@tanstack/react-query';

export function useFetchArchiveDownloadUrl(): (
  archiveId: string
) => Promise<string | null> {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return async (archiveId) => {
    const archive = await queryClient.fetchQuery({
      ...trpc.referentiels.preuvesArchive.get.queryOptions({ archiveId }),
      staleTime: 0,
    });
    return archive.downloadUrl;
  };
}
