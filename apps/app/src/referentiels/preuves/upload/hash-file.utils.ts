import { shasum256 } from '@/app/utils/shasum256';
import { DocumentHash, toDocumentHash } from '@tet/domain/collectivites';

export const hashFile = async (file: File): Promise<DocumentHash> =>
  toDocumentHash(await shasum256(file));
