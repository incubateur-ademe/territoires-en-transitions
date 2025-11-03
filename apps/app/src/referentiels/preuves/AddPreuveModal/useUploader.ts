import { useCollectiviteId } from '@/api/collectivites';
import { ENV } from '@/api/environmentVariables';
import { useUserSession } from '@/api/users/user-context/user-provider';
import { getAuthHeaders } from '@/api/utils/supabase/get-auth-headers';
import { shasum256 } from '@/app/utils/shasum256';
import { useEffect, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import {
  TUploader,
  UploadErrorCode,
  UploadStatus,
  UploadStatusCode,
} from './types';
import { useAddFileToLib } from './useAddFileToLib';
import { useCollectiviteBucketId } from './useCollectiviteBucketId';

/**
 * Gère l'upload et envoi une notification après un transfert réussi
 * afin de déclencher un refetch aux endroits où c'est nécessaire
 */
const addFileToBucket = async ({
  bucket_id,
  file,
  authHeaders,
  onStatusChange,
}: {
  bucket_id: string;
  file: File;
  authHeaders: { authorization: string; apikey: string };
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

  const abort = () => xhr.abort();

  // url de destination
  const url = `${ENV.supabase_url}/storage/v1/object/${bucket_id}/${hash}`;

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
    if (this.readyState === XMLHttpRequest.DONE) {
      if (this.status === 200) {
        onStatusChange({
          code: UploadStatusCode.uploaded,
          hash,
          filename: file.name,
        });
      } else {
        setError();
      }
    }
  };

  // appelé quand le transfert est interrompu
  xhr.upload.onabort = () => {
    onStatusChange({ code: UploadStatusCode.aborted });
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
  xhr.open('POST', url);
  for (const [key, value] of Object.entries(authHeaders)) {
    xhr.setRequestHeader(key, value as string);
  }
  xhr.send(file);
};

/**
 * Démarre l'upload d'un fichier et fourni un état de la progression
 * et une fonction permettant d'interrompre le transfert.
 */
export const useUploader = (
  /** contenu à stocker */
  file: File
): TUploader => {
  const session = useUserSession();
  // état de la progression
  const [status, setStatus] = useState<UploadStatus>({
    code: UploadStatusCode.running,
    progress: 0,
  });

  const collectivite_id = useCollectiviteId();
  const { addFileToLib } = useAddFileToLib();
  const bucket_id = useCollectiviteBucketId(collectivite_id);

  // pour éviter les uploads multiples du même fichier
  const upload = useDebouncedCallback(addFileToBucket, 500);

  // démarre l'upload du fichier
  useEffect(() => {
    // appelée quand l'upload est terminé
    const onStatusChange = (status: UploadStatus) => {
      if (status.code === UploadStatusCode.uploaded) {
        const { filename, hash } = status;
        // crée l'entrée dans la bibliothèque
        addFileToLib({ collectivite_id, filename, hash }).then((fichier) => {
          setStatus({
            code: UploadStatusCode.completed,
            fichier_id: fichier.id,
            hash,
          });
        });
      } else {
        setStatus(status);
      }
    };

    const fetchData = async () => {
      const authHeaders = await getAuthHeaders(session);
      if (bucket_id && authHeaders) {
        upload({ bucket_id, file, authHeaders, onStatusChange });
      }
    };
    fetchData();
  }, [collectivite_id, bucket_id, upload, file, addFileToLib, session]);

  return { status };
};
