import { ClassifyFichesError } from '../pipeline/classify-fiches/classify-fiches';

export type ClassifyBatchFailure =
  | ClassifyFichesError
  | { kind: 'unknown_enjeu'; enjeu: string };
