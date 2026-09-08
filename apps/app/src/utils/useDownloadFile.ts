import { saveBlob } from '@/app/referentiels/preuves/Bibliotheque/saveBlob';
import { DOWNLOAD_FILE_MUTATION_OPTIONS } from '@/app/utils/toast/download-file-mutation-options';
import { useMutation } from '@tanstack/react-query';

/** Télécharge un fichier du dossier "public" */
export const useDownloadFile = () =>
  useMutation({
    mutationKey: ['download_file'],

    mutationFn: async (filename: string) => {
      const response = await fetch(`/${filename}`);
      const blob = await response.blob();
      await saveBlob(blob, filename);
    },
    ...DOWNLOAD_FILE_MUTATION_OPTIONS,
  });
