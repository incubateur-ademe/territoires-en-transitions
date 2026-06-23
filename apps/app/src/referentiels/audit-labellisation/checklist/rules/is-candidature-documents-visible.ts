import { Etoile } from '@tet/domain/referentiels';

export const isCandidatureDocumentsVisible = (etoile: Etoile): boolean =>
  etoile > 1;
