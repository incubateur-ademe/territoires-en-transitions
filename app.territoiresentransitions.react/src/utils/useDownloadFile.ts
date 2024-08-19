import {useMutation} from 'react-query';
import {saveBlob} from 'ui/shared/preuves/Bibliotheque/saveBlob';

/** Télécharge un fichier du dossier "public" */
export const useDownloadFile = () =>
  useMutation('download_file', async (filename: string) => {
    const response = await fetch(`/${filename}`);
    const blob = await response.blob();
    await saveBlob(blob, filename);
  });
