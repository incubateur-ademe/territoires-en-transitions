import {
  fetchAndSaveFile,
  type FileToSave,
} from '@/app/utils/fetch-and-save-file';
import { DOWNLOAD_FILE_MUTATION_OPTIONS } from '@/app/utils/toast/download-file-mutation-options';
import { useMutation, type UseMutationResult } from '@tanstack/react-query';

export const useDownloadSignedFile = <TInput>(
  resolve: (input: TInput) => Promise<FileToSave>
): UseMutationResult<void, Error, TInput> =>
  useMutation({
    mutationFn: async (input: TInput): Promise<void> => {
      await fetchAndSaveFile(await resolve(input));
    },

    ...DOWNLOAD_FILE_MUTATION_OPTIONS,
  });
