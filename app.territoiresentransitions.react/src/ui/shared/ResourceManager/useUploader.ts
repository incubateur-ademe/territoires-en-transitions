import {supabaseClient} from 'core-logic/api/supabase';
import {ENV} from 'environmentVariables';
import {useEffect, useState} from 'react';
import {
  TUploader,
  UploadErrorCode,
  UploadStatus,
  UploadStatusCode,
} from './types';
import {ChangeNotifier} from 'core-logic/api/reactivity';
import {collectiviteBucketReadEndpoint} from 'core-logic/api/endpoints/CollectiviteBucketReadEndpoint';
import {useCollectiviteId} from 'core-logic/hooks/params';

/**
 * Gère l'upload et envoi une notification après un transfert réussi
 * afin de déclencher un refetch aux endroits où c'est nécessaire
 */
class PreuveUploader extends ChangeNotifier {
  async upload(
    collectiviteId: number,
    file: File,
    callback: (status: UploadStatus) => void
  ) {
    /**
     * On utilise une requête XHR plutôt que le client Supabase car celui-ci
     * ne permet pas d'avoir la progression et l'interruption.
     * Ref: https://github.com/supabase/storage-api/issues/23#issuecomment-973277262
     */
    const xhr = new XMLHttpRequest();
    const buckets = await collectiviteBucketReadEndpoint.getBy({
      collectivite_id: collectiviteId,
    });
    const bucket_id = buckets[0]?.bucket_id;

    const abort = () => xhr.abort();

    if (bucket_id) {
      // url de destination
      const url = `${ENV.supabase_url!}/storage/v1/object/${bucket_id}/${
        file.name
      }`;

      // attache les écouteurs d'événements
      xhr.upload.onprogress = (e: ProgressEvent<EventTarget>) => {
        const progress = (e.loaded / e.total) * 100;
        callback({
          code: UploadStatusCode.running,
          progress,
          abort,
        });
      };

      const notifyListeners = () => this.notifyListeners();
      // appelé quand le transfert est terminé
      xhr.onreadystatechange = function () {
        if (this.readyState === XMLHttpRequest.DONE) {
          if (this.status === 200) {
            callback({code: UploadStatusCode.completed});
            notifyListeners();
          } else {
            setError();
          }
        }
      };

      // appelé quand le transfert est interrompu
      xhr.upload.onabort = () => {
        console.log('aborted');
        callback({code: UploadStatusCode.aborted});
      };

      // appelé quand le transfert est terminé en erreur
      const setError = () => {
        callback({
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
  }
}

export const preuveUploader = new PreuveUploader();

/**
 * Démarre l'upload d'un fichier et fourni un état de la progression
 * et une fonction permettant d'interrompre le transfert.
 */
export const useUploader = (
  /** contenu à stocker */
  file: File
): TUploader => {
  // état de la progression
  const [status, setStatus] = useState<UploadStatus>({
    code: UploadStatusCode.running,
    progress: 0,
  });

  const collectiviteId = useCollectiviteId()!;

  useEffect(() => {
    preuveUploader.upload(collectiviteId, file, setStatus);
  }, [collectiviteId]);

  return {status};
};
