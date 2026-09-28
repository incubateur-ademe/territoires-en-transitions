import { DOWNLOAD_FILE_MUTATION_OPTIONS } from '@/app/utils/toast/download-file-mutation-options';
import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import {
  fetchAndSaveDocument,
  type SignedDownload,
} from './fetch-and-save-document';

export const useDownloadSignedFile = <TInput>(
  resolve: (input: TInput) => Promise<SignedDownload>
): UseMutationResult<void, Error, TInput> =>
  useMutation({
    mutationFn: async (input: TInput): Promise<void> => {
      await fetchAndSaveDocument(await resolve(input));
    },

    ...DOWNLOAD_FILE_MUTATION_OPTIONS,
  });
