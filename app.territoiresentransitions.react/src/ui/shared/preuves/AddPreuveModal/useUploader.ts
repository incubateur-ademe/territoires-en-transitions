import {supabaseClient} from 'core-logic/api/supabase';
import {ENV} from 'environmentVariables';
import {useEffect, useState} from 'react';
import {
  TUploader,
  UploadErrorCode,
  UploadStatus,
  UploadStatusCode,
} from './types';
import {collectiviteBucketReadEndpoint} from 'core-logic/api/endpoints/CollectiviteBucketReadEndpoint';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {shasum256} from 'utils/shasum256';
import {useAddFileToLib} from './useAddFileToLib';

/**
 * Gère l'upload et envoi une notification après un transfert réussi
 * afin de déclencher un refetch aux endroits où c'est nécessaire
 */
const addFileToBucket = async ({
  collectivite_id,
  file,
  onStatusChange,
}: {
  collectivite_id: number;
  file: File;
  onStatusChange: (status: UploadStatus) => void;
}) => {
  // calcule une somme de contrôle du fichier
  // celle-ci va servir de nom unique pour le fichier dans le bucket
  // le nom original du fichier est sauvegardé après l'upload dans la table `bibliotheque_fichier`
  const hash = await shasum256(file);

  /**
   * On utilise une requête XHR plutôt que le client Supabase car celui-ci
   * ne permet pas d'avoir la progression et l'interruption.
   * Ref: https://github.com/supabase/storage-api/issues/23#issuecomment-973277262
   */
  const xhr = new XMLHttpRequest();
  const buckets = await collectiviteBucketReadEndpoint.getBy({
    collectivite_id,
  });
  const bucket_id = buckets[0]?.bucket_id;

  const abort = () => xhr.abort();

  if (bucket_id) {
    // url de destination
    const url = `${ENV.supabase_url!}/storage/v1/object/${bucket_id}/${hash}`;

    // attache les écouteurs d'événements
    xhr.upload.onprogress = (e: ProgressEvent<EventTarget>) => {
      const progress = (e.loaded / e.total) * 100;
      onStatusChange({
        code: UploadStatusCode.running,
        progress,
        abort,
      });
    };

    // appelé quand le transfert est terminé
    xhr.onreadystatechange = function () {
      if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
        onStatusChange({
          code: UploadStatusCode.uploaded,
          hash,
          filename: file.name,
        });
      }
    };

    // appelé quand le transfert est interrompu
    xhr.upload.onabort = () => {
      onStatusChange({code: UploadStatusCode.aborted});
    };

    // appelé quand le transfert est terminé en erreur
    const setError = () => {
      onStatusChange({
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
};

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

  const collectivite_id = useCollectiviteId()!;
  const {addFileToLib} = useAddFileToLib();

  const onStatusChange = (status: UploadStatus) => {
    if (status.code === UploadStatusCode.uploaded) {
      const {filename, hash} = status;
      // crée l'entrée dans la bibliothèque
      addFileToLib({collectivite_id, filename, hash}).then(fichier => {
        setStatus({code: UploadStatusCode.completed, fichier_id: fichier.id});
      });
    } else {
      setStatus(status);
    }
  };

  useEffect(() => {
    if (collectivite_id) {
      addFileToBucket({collectivite_id, file, onStatusChange});
    }
  }, [collectivite_id]);

  return {status};
};
