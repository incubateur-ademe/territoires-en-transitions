import { calculateDocumentHash } from '@tet/backend/collectivites/documents/store-document/calculate-document-hash.utils';
import {
  FicheCandidate,
  FicheFingerprint,
  processedFicheAnalysisSchema,
} from '../models/fiche-analysis';

type CalculateFicheFingerprint = (
  fiche: Pick<FicheCandidate, 'titre' | 'description'>
) => FicheFingerprint;

export const calculateFicheFingerprint: CalculateFicheFingerprint = ({
  titre,
  description,
}) =>
  processedFicheAnalysisSchema.shape.fingerprint.parse(
    calculateDocumentHash(
      Buffer.from(JSON.stringify([titre, description ?? '']), 'utf8')
    )
  );
