import { shasum256 } from '@/app/utils/shasum256';
import { useCollectiviteId } from '@tet/api/collectivites';
import { useUserContext } from '@tet/api/users';
import { getFilesPerHash } from '../Bibliotheque/useFichiers';
import { uploadFileToBucket } from './upload-file-to-bucket';
import { useAddFileToLib } from './useAddFileToLib';
import { useCollectiviteBucketId } from './useCollectiviteBucketId';

type UploadFileArgs = {
  file: File;
  signal?: AbortSignal;
  onProgress?: (percent: number) => void;
};

export const useUploadFileToCollectiviteLibrary = (): ((
  args: UploadFileArgs
) => Promise<number | null>) => {
  const collectiviteId = useCollectiviteId();
  const bucketId = useCollectiviteBucketId(collectiviteId);
  const { authHeaders } = useUserContext();
  const { addFileToLib } = useAddFileToLib();

  return async ({ file, signal, onProgress }) => {
    if (!collectiviteId || !bucketId || !authHeaders) return null;

    const hash = await shasum256(file);

    const alreadyUploadedFiles = await getFilesPerHash(collectiviteId, [hash]);
    const alreadyUploadedFichierId = alreadyUploadedFiles?.find(
      (f) => f.hash === hash
    )?.id;
    if (alreadyUploadedFichierId !== undefined) return alreadyUploadedFichierId;

    const { filename } = await uploadFileToBucket({
      bucketId,
      file,
      authHeaders,
      signal,
      onProgress,
      precomputedHash: hash,
    });
    const fichier = await addFileToLib({ collectiviteId, filename, hash });
    return fichier.id;
  };
};
