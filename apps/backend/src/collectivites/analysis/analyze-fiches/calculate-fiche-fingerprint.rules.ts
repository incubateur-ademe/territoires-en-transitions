import { notImplemented } from '@tet/backend/utils/not-implemented';
import { FicheCandidate, FicheFingerprint } from '../models/fiche-analysis';

type CalculateFicheFingerprint = (
  fiche: Pick<FicheCandidate, 'titre' | 'description'>
) => FicheFingerprint;

export const calculateFicheFingerprint: CalculateFicheFingerprint =
  notImplemented('calculateFicheFingerprint');
