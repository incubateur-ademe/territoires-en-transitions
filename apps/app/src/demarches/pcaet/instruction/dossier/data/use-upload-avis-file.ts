'use client';

import { getFilesPerHash } from '@/app/referentiels/preuves/Bibliotheque/useFichiers';
import { uploadFileToBucket } from '@/app/referentiels/preuves/upload/upload-file-to-bucket';
import { useAddFileToLib } from '@/app/referentiels/preuves/upload/useAddFileToLib';
import { useCollectiviteBucketId } from '@/app/referentiels/preuves/upload/useCollectiviteBucketId';
import { shasum256 } from '@/app/utils/shasum256';
import { useUserContext } from '@tet/api/users';
import { useInstructeurCollectiviteId } from '../../data/use-contexte-instruction';

/**
 * Verse la pièce d'un avis dans la bibliothèque du service **instructeur**, où
 * `get-avis-file-url` la résout par l'émetteur. La collectivité courante étant
 * la déposante depuis la bascule de contexte, s'y fier enverrait le rapport dans
 * une bibliothèque interdite à l'agent, et l'avis validé serait introuvable.
 */
export const useUploadAvisFile = (): ((
  file: File
) => Promise<string | null>) => {
  const collectiviteId = useInstructeurCollectiviteId();
  const bucketId = useCollectiviteBucketId(collectiviteId);
  const { authHeaders } = useUserContext();
  const { addFileToLib } = useAddFileToLib();

  return async (file) => {
    if (!collectiviteId || !bucketId || !authHeaders) return null;

    const hash = await shasum256(file);

    const alreadyUploadedFiles = await getFilesPerHash(collectiviteId, [hash]);
    if (alreadyUploadedFiles?.some((f) => f.hash === hash)) return hash;

    const { filename } = await uploadFileToBucket({
      bucketId,
      file,
      authHeaders,
      precomputedHash: hash,
    });
    await addFileToLib({ collectiviteId, filename, hash });
    return hash;
  };
};
