import { useCollectiviteId } from '@tet/api/collectivites';
import { hashFile } from './hash-file.utils';
import { useUploadFile } from './use-upload-file';

type UploadFileToLibraryArgs = {
  file: File;
  signal?: AbortSignal;
  onProgress?: (percent: number) => void;
};

export const useUploadFileToCollectiviteLibrary = (): ((
  args: UploadFileToLibraryArgs
) => Promise<number>) => {
  const collectiviteId = useCollectiviteId();
  const uploadFile = useUploadFile();

  return async ({ file, signal, onProgress }) => {
    const hash = await hashFile(file);
    return uploadFile({ collectiviteId, file, hash, signal, onProgress });
  };
};
