import { saveBlob } from '@/app/utils/save-blob';
import { DOWNLOAD_FILE_MUTATION_OPTIONS } from '@/app/utils/toast/download-file-mutation-options';
import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

export const useDownloadDocument = ({
  collectiviteId,
}: {
  collectiviteId: number;
}): UseMutationResult<void, Error, number> => {
  const trpc = useTRPC();

  const mutationOptions =
    trpc.collectivites.documents.getDownloadUrl.mutationOptions();

  return useMutation({
    mutationKey: mutationOptions.mutationKey,

    mutationFn: async (fichierId: number): Promise<void> => {
      const document = await mutationOptions.mutationFn?.({
        collectiviteId,
        fichierId,
      });
      if (!document) {
        return;
      }

      const response = await fetch(document.signedUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      await saveBlob(await response.blob(), document.filename);
    },

    ...DOWNLOAD_FILE_MUTATION_OPTIONS,
  });
};
