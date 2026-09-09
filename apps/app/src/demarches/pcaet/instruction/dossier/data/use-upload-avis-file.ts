'use client';

import { hashFile } from '@/app/referentiels/preuves/upload/hash-file.utils';
import { useUploadFile } from '@/app/referentiels/preuves/upload/use-upload-file';
import { DocumentHash } from '@tet/domain/collectivites';
import { useInstructeurCollectiviteId } from '../../data/use-contexte-instruction';

/**
 * Verse la pièce d'un avis dans la bibliothèque du service **instructeur**, où
 * `get-avis-file-url` la résout par l'émetteur. La collectivité courante étant
 * la déposante depuis la bascule de contexte, s'y fier enverrait le rapport dans
 * une bibliothèque interdite à l'agent, et l'avis validé serait introuvable.
 */
export const useUploadAvisFile = (): ((
  file: File
) => Promise<DocumentHash | null>) => {
  const collectiviteId = useInstructeurCollectiviteId();
  const uploadFile = useUploadFile();

  return async (file) => {
    if (!collectiviteId) return null;

    const hash = await hashFile(file);
    await uploadFile({ collectiviteId, file, hash });
    return hash;
  };
};
