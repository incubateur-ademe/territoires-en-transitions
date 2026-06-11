import { useCollectiviteId } from '@tet/api/collectivites';
import { useUserContext } from '@tet/api/users';
import { useEffect, useRef, useState } from 'react';
import { uploadFileToBucket } from '../upload/upload-file-to-bucket';
import { useAddFileToLib } from '../upload/useAddFileToLib';
import { useCollectiviteBucketId } from '../upload/useCollectiviteBucketId';
import {
  TUploader,
  UploadErrorCode,
  UploadStatus,
  UploadStatusCode,
} from './types';

export const useUploader = (file: File): TUploader => {
  const { authHeaders } = useUserContext();
  const collectiviteId = useCollectiviteId();
  const { addFileToLib } = useAddFileToLib();
  const bucketId = useCollectiviteBucketId(collectiviteId);

  const [status, setStatus] = useState<UploadStatus>({
    code: UploadStatusCode.running,
    progress: 0,
  });

  // Les dépendances `authHeaders`/`addFileToLib`/`collectiviteId`/`bucketId`
  // peuvent voir leur identité changer sur des re-renders parent sans qu'il
  // soit pertinent de relancer l'upload. On capture leurs valeurs courantes
  // dans des refs, et seul `file` (ou la première transition "ready") déclenche
  // réellement le pipeline.
  const latestRef = useRef({ authHeaders, addFileToLib, collectiviteId, bucketId });
  useEffect(() => {
    latestRef.current = { authHeaders, addFileToLib, collectiviteId, bucketId };
  });

  const isReady = Boolean(bucketId && authHeaders && collectiviteId);

  useEffect(() => {
    if (!isReady) return;
    const controller = new AbortController();
    let cancelled = false;

    const run = async (): Promise<void> => {
      const { authHeaders, addFileToLib, collectiviteId, bucketId } =
        latestRef.current;
      if (!bucketId || !authHeaders || !collectiviteId) return;

      try {
        const { hash, filename } = await uploadFileToBucket({
          bucketId,
          file,
          authHeaders,
          signal: controller.signal,
          onProgress: (progress) => {
            if (!cancelled) {
              setStatus({
                code: UploadStatusCode.running,
                progress,
                abort: () => controller.abort(),
              });
            }
          },
        });
        if (cancelled) return;
        const fichier = await addFileToLib({ collectiviteId, filename, hash });
        if (cancelled) return;
        setStatus({
          code: UploadStatusCode.completed,
          fichier_id: fichier.id,
          hash,
        });
      } catch (err) {
        if (cancelled) return;
        if (err instanceof DOMException && err.name === 'AbortError') {
          setStatus({ code: UploadStatusCode.aborted });
        } else {
          setStatus({
            code: UploadStatusCode.failed,
            error: UploadErrorCode.uploadError,
          });
        }
      }
    };

    run();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [file, isReady]);

  return { status };
};
