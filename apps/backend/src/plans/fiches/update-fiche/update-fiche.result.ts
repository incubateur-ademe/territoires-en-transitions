import { UpdateFicheError } from './update-fiche.errors';

export type Result<T, E = UpdateFicheError> =
  | { success: true; data: T }
  | { success: false; error: E };

