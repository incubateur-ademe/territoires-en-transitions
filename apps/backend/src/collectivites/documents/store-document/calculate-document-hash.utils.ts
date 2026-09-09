import { DocumentHash, toDocumentHash } from '@tet/domain/collectivites';
import { createHash } from 'crypto';

export const calculateDocumentHash = (content: Buffer): DocumentHash =>
  toDocumentHash(createHash('sha256').update(content).digest('hex'));
