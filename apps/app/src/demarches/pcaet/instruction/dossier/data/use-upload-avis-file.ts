'use client';

import { hashFile } from '@/app/collectivites/documents/upload/hash-file.utils';
import { useUploadFile } from '@/app/collectivites/documents/upload/use-upload-file';
import { DocumentHash } from '@tet/domain/collectivites';
import { useInstructeurCollectiviteId } from '../../data/use-contexte-instruction';

/**
 * Verse la pièce d'un avis dans la bibliothèque du service **instructeur**, où
 * `get-avis-file-url` la résout par l'émetteur. La collectivité courante étant
 * la déposante depuis la bascule de contexte, s'y fier enverrait le rapport dans
 * une bibliothèque interdite à l'agent, et l'avis validé serait introuvable.
 *
 * Le rapport est confidentiel : il ne se lit que par le circuit de l'avis, pas
 * en parcourant la bibliothèque de son émetteur. Le dépôt de l'avis repose la
 * marque de son côté, pour les fichiers que la déduplication par empreinte
 * rend sans repasser par ici.
 */
export const useUploadAvisFile = (): ((
  file: File
) => Promise<DocumentHash | null>) => {
  const collectiviteId = useInstructeurCollectiviteId();
  const uploadFile = useUploadFile();

  return async (file) => {
    if (!collectiviteId) return null;

    const hash = await hashFile(file);
    await uploadFile({ collectiviteId, file, hash, confidentiel: true });
    return hash;
  };
};
