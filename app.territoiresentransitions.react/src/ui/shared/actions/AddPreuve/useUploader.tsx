import {supabaseClient} from 'core-logic/api/supabase';
import {ENV} from 'environmentVariables';
import {useEffect, useState} from 'react';
import {
  TUploader,
  UploadErrorCode,
  UploadStatus,
  UploadStatusCode,
} from './Uploader.d';

/**
 * Démarre l'upload d'un fichier et fourni un état de la progression
 * et une fonction permettant d'interrompre le transfert.
 *
 * On utilise une requête XHR plutôt que le client Supabase car celui-ci
 * ne permet pas d'avoir la progression et l'interruption.
 * Ref: https://github.com/supabase/storage-api/issues/23#issuecomment-973277262
 */
export const useUploader = (
  /** identifiant du stockage */
  bucket: string,
  /** chemin/nom de fichier dans lequel stocker */
  path: string,
  /** contenu à stocker */
  file: File
): TUploader => {
  // état de la progression
  const [status, setStatus] = useState<UploadStatus>({
    code: UploadStatusCode.running,
    progress: 0,
  });

  let xhr: XMLHttpRequest;

  useEffect(() => {
    if (!xhr && bucket) {
      // url de destination
      const url = `${ENV.supabase_url!}/storage/v1/object/${bucket}/${
        file.name
      }`;

      // crée la requête
      xhr = new XMLHttpRequest();
      const abort = () => xhr.abort();

      // attache les écouteurs d'événements
      xhr.upload.onprogress = (e: ProgressEvent<EventTarget>) => {
        const progress = (e.loaded / e.total) * 100;
        setStatus({
          code: UploadStatusCode.running,
          progress,
          abort,
        });
      };

      // appelé quand le transfert est terminé
      xhr.onreadystatechange = function () {
        if (this.readyState === XMLHttpRequest.DONE) {
          if (this.status === 200) {
            setStatus({code: UploadStatusCode.completed});
          } else {
            setError();
          }
        }
      };

      // appelé quand le transfert est interrompu
      xhr.upload.onabort = () => {
        console.log('aborted');
        setStatus({code: UploadStatusCode.aborted});
      };

      // appelé quand le transfert est terminé en erreur
      const setError = () => {
        setStatus({
          code: UploadStatusCode.failed,
          error: UploadErrorCode.uploadError,
        });
      };
      xhr.upload.onerror = xhr.upload.ontimeout = setError;

      // attache les en-têtes et démarre l'envoi
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: on utilise ici volontairement une fonction privée du client
      // supabase pour récupérer les en-têtes contenant le token d'auth.
      const headers = supabaseClient._getAuthHeaders();
      xhr.open('POST', url);
      for (const [key, value] of Object.entries(headers)) {
        xhr.setRequestHeader(key, value as string);
      }
      xhr.send(file);
    }
  }, [bucket]);

  return {status};
};
