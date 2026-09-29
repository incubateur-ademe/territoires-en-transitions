import { fetchAndSaveFile } from '@/app/utils/fetch-and-save-file';
import { DOWNLOAD_FILE_MUTATION_OPTIONS } from '@/app/utils/toast/download-file-mutation-options';
import { useMutation } from '@tanstack/react-query';

/** Télécharge un fichier du dossier "public" */
export const useDownloadFile = () =>
  useMutation({
    mutationKey: ['download_file'],

    mutationFn: (filename: string) =>
      fetchAndSaveFile({ url: `/${filename}`, filename }),
    ...DOWNLOAD_FILE_MUTATION_OPTIONS,
  });
